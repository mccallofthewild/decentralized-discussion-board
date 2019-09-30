
<template lang="pug">
div 
  form(@submit.prevent="save").profile
    Avatar(
      :avatar-image="accountData.profile.avatarImage"
      large
    ).profile__image
      xImageInput(
        name="profile-image"
        v-if="isEditing"
        :process-jimp="jimp => jimp.cover(250,250)"
        @data-uri="uri => accountDraft.profile.avatarImage.base64 = uri"
        @image-type="type => accountDraft.profile.avatarImage.fileType = type"
      ).profile__image__input--upload
        template(#activator="{ activate }") 
          div(@click="activate").input--upload__activator
            span Edit 
    div(
      style=`
        width: 100%;
        position: relative;
      `
    )
      div(
        style=`
          width: 100%;
          height: 100%;
          position: absolute;
          pointer-events: none;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 2;
          background-image: linear-gradient(to right, white, transparent, transparent, transparent, white);
        `
      )
      div(
        style=`
          display: flex;
          flex-direction: row;
          width: 100%;
          overflow-x: scroll;
          align-items: center;
          justify-content: flex-start;
          padding: 10px;
          border-radius: 200px;
        `
        @mouseover.once=`e => {
            const width = e.target.scrollWidth / 3
            e.target.scrollLeft = width;
        }`
          
        @scroll=`e => {
          const sectionWidth = e.target.scrollWidth / 3
          const tooFarToRight = sectionWidth * 2 < e.target.scrollLeft
          const tooFarToLeft = e.target.scrollLeft < sectionWidth;
          if (tooFarToRight) {
            e.target.scrollLeft = sectionWidth;
          } else if (tooFarToLeft) {
            e.target.scrollLeft = sectionWidth * 2
          }
        }`
      )
        Avatar(
          v-for="avi in Array.from({ length: avatars.length * 3 }, (a, i) => avatars[i%avatars.length])"
          :key="avi"
          medium
          style="margin: 5px;"
          :avatar-image="{ base64: avi }"
  
        )
          div(
            style=`
              height: 100%;
              width: 100%;
              position: absolute;
              z-index: 2;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              cursor: pointer;
            `
            @click="accountDraft.profile.avatarImage.base64 = avi"
          )
    h1 
      input(
        type="text" 
        placeholder="Harry Potter" 
        required 
        :readonly="!isEditing" 
        v-model="accountData.profile.displayName"
      )
    span 
      | @
      input(
        type="text" 
        placeholder="daboiwholived" 
        ref="username" 
        required 
        :readonly="!isEditing" 
        v-model="accountData.profile.username"
        @blur="accountData.profile.username = formatUsername(accountData.profile.username, { end: true })"
      )
    small
      nuxt-link(v-if="!isEditing" :to="{ name: 'transactions', query: { from: accountData.primaryAddress }}") {{ accountData.primaryAddress }}
      select(
        v-else
        required 
        v-model="accountData.primaryAddress"
      )
        option(v-for="address in addressOptions" :value="address") {{ address }}
    blockquote
      textarea(
        type="text" 
        required 
        :readonly="!isEditing" 
        v-model="accountData.profile.biography"
      )
    template(v-if="isEditing")
      button(type="submit")
        span.emoji 💾
        | Save
    template(v-else-if="account && auth && auth.account && auth.account.id == account.id")
      button(type="button" @click="edit")
        span.emoji 💾
        | Edit
</template>


<script>
import { avatars } from '~/assets/images/avatars'

import defaultAvatar from '~/assets/images/default-avatar.svg'
import gql from 'graphql-tag'
import {
  QUERY_AUTH,
  MUTATION_ACCOUNT,
  MUTATION_IMAGE,
  MUTATION_PROFILE
} from '~/client-graphql'
import {
  usernameRegex,
  inverseUsernameRegex,
  formatUsername,
  extract
} from '~/utils'
export default {
  props: ['account'],
  mounted() {
    // if account not provided, prepare to create
    if (!this.account) this.isEditing = true
  },
  data: _ => ({
    avatars,
    usernameRegex,
    auth: null,
    isEditing: false,
    snapshot: {
      account: null,
      profile: null,
      avatarImage: null
    },
    accountDraft: {
      primaryAddress: '',
      profile: {
        username: 'theboywholived',
        displayName: 'Harry Potter',
        biography: 'The wand chooses the wizard',
        avatarImage: {
          alt: '',
          base64: '',
          fileType: ''
        }
      }
    }
  }),
  methods: {
    formatUsername,
    formatAvatarPath(avatar) {
      return avatar
        .split('/')
        .pop()
        .replace('icons8-', '')
        .replace('.svg', '')
        .split('-')
        .map(word => {
          let [first, ...chars] = word
          first = first.toUpperCase()
          return [first, ...chars].join('')
        })
        .join(' ')
    },
    edit() {
      this.assignAccountToDraft()
      this.isEditing = true
    },
    takeSnapshot(account) {
      return {
        account: extract(account, ['id', 'primaryAddress']),
        profile: extract(account.profile, [
          'id',
          'displayName',
          'username',
          'biography'
        ]),
        avatarImage: extract(account.profile.avatarImage || {}, [
          'id',
          'alt',
          'base64',
          'fileType'
        ])
      }
    },
    assignAccountToDraft() {
      const snapshot = this.takeSnapshot(this.account)
      this.snapshot = JSON.parse(JSON.stringify(snapshot))
      this.accountDraft = {
        ...snapshot.account,
        profile: {
          ...snapshot.profile,
          avatarImage: {
            ...snapshot.avatarImage
          }
        }
      }
    },
    hasChanged(old, fresh) {
      return JSON.stringify(old) != JSON.stringify(fresh)
    },
    async save() {
      const snapshots = this.takeSnapshot(this.accountDraft)
      const { account, profile, avatarImage } = snapshots

      const accountChanged = this.hasChanged(this.snapshot.account, account)
      const profileChanged = this.hasChanged(this.snapshot.profile, profile)
      const avatarImageChanged = this.hasChanged(
        this.snapshot.avatarImage,
        avatarImage
      )

      let avatarImageId = avatarImage.id
      if (avatarImageChanged) {
        const {
          data: {
            image: { id: imageId }
          }
        } = await this.$apollo.mutate({
          mutation: MUTATION_IMAGE,
          variables: {
            image: avatarImage
          }
        })
        avatarImageId = imageId
        console.log('updated avatar image')
      }

      let profileId = profile.id
      if (avatarImageChanged || profileChanged) {
        const {
          data: {
            profile: { id }
          }
        } = await this.$apollo.mutate({
          mutation: MUTATION_PROFILE,
          refetchQueries: [{ query: QUERY_AUTH }],
          variables: {
            profile: {
              ...profile,
              avatarImageId
            }
          }
        })
        profileId = id
        console.log('updated profile')
      }
      if (accountChanged) {
        const {
          data: {
            account: { id: accountId }
          }
        } = await this.$apollo.mutate({
          mutation: MUTATION_ACCOUNT,
          refetchQueries: [{ query: QUERY_AUTH }],
          variables: {
            account: {
              ...account,
              profileId
            }
          }
        })
        console.log('updated account')
      }
      this.isEditing = false
      alert('saved')
    }
  },
  apollo: {
    auth: {
      query: QUERY_AUTH,
      update({ auth }) {
        this.auth = auth
        // default the primaryAddress to the logged in address
        if (
          this.auth &&
          this.auth.address &&
          !this.accountData.primaryAddress
        ) {
          this.accountData.primaryAddress = this.auth.address
        }
        return this.auth
      }
    }
  },
  computed: {
    addressOptions() {
      // if not editing, should just be the account's address
      if (!this.isEditing)
        return this.account ? [this.account.primaryAddress] : []
      return (
        (this.auth && (this.auth.account && this.auth.account.addresses)) ||
        (this.auth.address && [this.auth.address])
      )
    },
    accountData() {
      return this.isEditing
        ? this.accountDraft
        : // default to draft if account not present
          this.account
    }
  },
  watch: {
    ['accountDraft.profile.username'](val = '', prev) {
      const formattedVal = formatUsername(val, { end: false })
      if (formattedVal == val) return
      console.log('updating username')
      this.accountDraft.profile.username = formattedVal
    }
  }
}
</script>


<style lang="stylus">
.profile {
  display: flex;
  flex-direction: column;

  input, select, textarea {
    border: none;
    background: transparent;
    font-size: inherit;
  }

  .profile__image {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    &__input--upload {
      width: 100%;
      height: 100%;

      .input--upload__activator {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1rem;
        cursor: pointer;
        text-transform: uppercase;
        font-weight: 800;
        background-color: rgba(white, 0.5);
      }
    }
  }
}
</style>