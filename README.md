# arweave-discussion-board

> Decentralized Arweave Discussion Board [for Gitcoin](https://github.com/ArweaveTeam/Bounties/issues/13)
> With parts inspired by https://github.com/ArweaveTeam/weavemail/
> Using https://github.com/ArweaveTeam/arweave-js
## Project Requirements 
### Bird's Eye
- [ ] Open-source code available over GitHub.
- [ ] The forum needs to be built with web technologies without the use of a backend.

### Features
- [ ] Login using Arweave wallets. No registration required.
- [ ] Needs to have Categories and sub-categories.
- [ ] Any user is able to see the history of an edited post (thanks to Arweave’s Permaweb features)
- [ ] There is no admin/moderators. Every user can participate in voting down bad posts or rewarding good content and anyone can create a category or subcategory.
- [ ] Like/thumb_up system. Users will be able to like/thumb_up others posts 
  - [ ] Users cannot upvote their own posts 
  - [ ] Upvotes tip the 0.10 AR to the owner of that post 
  - [ ] Downvotes send 0.10 AR to miners 
- [ ] Post replies in threads are ordered by date and by like/thumb_up. 
  - Similar to how Reddit works.
- [ ] If a post after counting all positive votes and negative votes have a total of negative votes the post should be shown as an inactive one (greyed out for example) and content should be hidden until the user clicks a button to show the content of that post/thread. If you have another approach to combat spam please let us know on Discord.

## Problems Faced
Getting the simplicity of an ORM with the benefits of decentralization.

### Data Searchability 
> By default, Arweave (AR) transaction (tx) `data` is not queryable. This is good because it enables efficient storage practices. AR tx `tags` are searchable, but are difficult to work with. My solution was to build an 
Implemented client-side GraphQL wrapper around Arweave, taking advantage of the strengths in both the ArQL tag search system and Arweave document storage

### Permissioned & Validated Storage
> With distributed storage applications, anyone can *write* to our "database". So authentication and validation needs to be on the *read* side.
First querying all transactions to an object with ID of `X`

### Users 
Wallets should be associated with usernames 
### Multi-wallet Login
Created 


## Build Setup

``` bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
