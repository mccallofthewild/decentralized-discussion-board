
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
        :process-jimp="jimp => jimp.cover(250,250).quality(1)"
        @data-uri="uri => accountDraft.profile.avatarImage.base64 = uri"
        @image-type="type => accountDraft.profile.avatarImage.fileType = type"
      ).profile__image__input--upload
        template(#activator="{ activate }") 
          div(@click="activate").input--upload__activator
            span Edit 
    //- SelectLocalAvatar(
    //-   v-if="isEditing"
    //-   @selected="avi => accountDraft.profile.avatarImage.base64 = avi"
    //- )
    h1 
      input(
        type="text" 
        placeholder="Your Name" 
        required 
        :readonly="!isEditing" 
        v-model="accountData.profile.displayName"
      )
    span 
      | @
      input(
        type="text" 
        placeholder="yourusername" 
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
        placeholder="Write something about yourself..."
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
import defaultAvatar from '~/assets/images/default-avatar.svg'
import gql from 'graphql-tag'
import {
  QUERY_AUTH,
  MUTATION_ACCOUNT,
  MUTATION_IMAGE,
  MUTATION_PROFILE,
  MUTATION_AUTH_ACCOUNT
} from '~/client-graphql'
import {
  usernameRegex,
  inverseUsernameRegex,
  formatUsername,
  extract
} from '~/utils'
export default {
  props: ['account'],
  beforeMount() {
    // if account not provided, prepare to create
    if (!this.account) this.edit()
    else this.assignAccountToDraft()
  },

  data: _ => ({
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
        username: '',
        displayName: '',
        biography: '',
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
      const snapshot = this.takeSnapshot(this.account || this.accountDraft)
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

      // images are immutable
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
        console.log(`\n\n\n SAVED IMAGE \n\n\n`)
      }

      return console.log(
        '\n\n\n\nRETURNING BC I ONLY CARE ABOUT IMAGES RN\n\n\n\n'
      )

      let profileId = profile.id
      if (avatarImageChanged || profileChanged) {
        const {
          data: {
            profile: { id }
          }
        } = await this.$apollo.mutate({
          mutation: MUTATION_PROFILE,
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
      let finalAccountId
      // debugger
      if (
        accountChanged ||
        (!this.snapshot.profile || profileId != this.snapshot.profile.id)
      ) {
        const {
          data: { account: accountData } = {}
        } = await this.$apollo.mutate({
          mutation: MUTATION_ACCOUNT,
          variables: {
            account: {
              ...account,
              profileId
            }
          }
        })

        finalAccountId = accountData ? accountId : null
        console.log('updated account')
      }
      const {
        data: { id: completed }
      } = await this.$apollo.mutate({
        mutation: MUTATION_AUTH_ACCOUNT,
        variables: {
          accountId: finalAccountId
        }
      })

      await this.$apollo.queries.auth.refetch()
      this.isEditing = !!completed
      // alert('saved')
      console.log(`\n\n\n SAVED PROFILE \n\n\n`)
    }
  },
  apollo: {
    auth: {
      query: QUERY_AUTH
    }
  },
  computed: {
    addressOptions() {
      // if not editing, should just be the account's address
      if (!this.isEditing && this.account) {
        return this.account ? [this.account.primaryAddress] : []
      }
      return (
        this.auth &&
        ((this.auth.account && this.auth.account.addresses) ||
          (this.auth.address && [this.auth.address]))
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
    auth() {
      // default the primaryAddress to the logged in address
      if (this.auth && this.auth.address && !this.accountData.primaryAddress) {
        this.accountData.primaryAddress = this.auth.address
      }
    },
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
      background: rgba(black, 0.1);
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;

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