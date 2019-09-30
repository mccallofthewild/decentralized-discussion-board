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
  - [ ] * Categories are like hashtags. Creators do not *own* their records.
- [ ] Any user is able to see the history of an edited post (thanks to Arweave’s Permaweb features)
- [ ] There is no admin/moderators. Every user can participate in voting down bad posts or rewarding good content and anyone can create a category or subcategory.
- [ ] Like/thumb_up system. Users will be able to like/thumb_up others posts 
  - [ ] Users cannot upvote their own posts 
  - [ ] Upvotes tip the 0.10 AR to the owner of that post 
    - [ ] * Sent to owner's `primaryAddress`
      - [ ] * if `primaryAddress` is invalid, sends to post's owner address
      - [ ] * `primaryAddress`'s must have sent at least one transaction
        - [ ] OR (considering) must belong to an authorized wallet, and `Permission`'s are invalid if they are disabling the `primaryAddress` wallet. This would also be a way to prevent account inaccessibility, as one wallet would always need authorization.
  - [ ] Downvotes send 0.10 AR to miners 
  - [ ] * Vote payments are verified on load, filtering out insufficient payments
  - [ ] * Go through each data type and ask how you can be sure that no-one can hack it
- [ ] Post replies in threads are ordered by date and by like/thumb_up. 
  - Similar to how Reddit works.
- [ ] If a post after counting all positive votes and negative votes have a total of negative votes the post should be shown as an inactive one (greyed out for example) and content should be hidden until the user clicks a button to show the content of that post/thread. If you have another approach to combat spam please let us know on Discord.

## Challenges
Getting the simplicity of an ORM with the benefits of decentralization.
### Accounts 
I think we should think of wallets as user-managed authentication tokens.
*Wallets **are not** accounts.* [Arweave ID](https://arweave.net/fGUdNmXFmflBMGI2f9vD7KzsrAc1s1USQgQLgAVT0W0) is like a phone book. It's handy for putting names to addresses. not an application authorization protocol. seems like a good idea until you want to log in on more than one device, or in more than one app, without compromising 
### Write Delays
> It currently takes several minutes for arweave transactions to save to the blockweave. This can make an irritating and confusing UX for Web 2.0 users, who expect near-instant feedback. 
Used [optimistic UI](https://uxplanet.org/optimistic-1000-34d9eefe4c05) practices to simulate synchronous actions. A `localStorage` browser cache persists optimistic actions on reload, deletes them when the transaction record is accessible, and expires them if the transaction is unsuccessful.
### CORS Error 
> run `rmdir ~/opera-empty-dir && mkdir ~/opera-empty-dir && open -a Opera --args --disable-web-security --user-data-dir=~/opera-empty-dir`
> https://discordapp.com/channels/357957786904166400/357957786904166401
### Database Functionality 
> By default, Arweave (AR) transaction (tx) `data` is not queryable. This is good because it enables efficient storage practices. AR tx `tags` are searchable, but are difficult to work with. My solution was to build an 
Implemented client-side GraphQL wrapper around Arweave, taking advantage of the strengths in both the ArQL tag search system and Arweave document storage 
### Rules
Mutltiple upvotes per user are allowed 
### Permissioned & Validated Storage
> With distributed storage applications, anyone can *write* to our "database". So authentication and validation needs to be on the *read* side.
### ArQL Sucks
Created a new, intuitive way to submit arql queries.
```javascript
const cars = await CarModel.findAll({
  color: 'blue',
  model: 'volvo'
})
```
Preventing client-side **WRITE** actions is only a nicety to tell users that their record will not work, and will not display in the UI. A thorough authorization and data-integrity filtering & reduction process is implemented for the actual validation. 

To prevent editing of records by non-owners:
1. Records must have unique ID's
2. The first transaction with a given record ID is the Root record 
   1. Arweave sorts transactions [by block height](https://github.com/ArweaveTeam/arweave/blob/bfcab4b5aa38b6760e479663431b85773a5bce68/src/ar_tx_search.erl#L77)
3. All following record transactions must comply with the Root record owner's authentication rules.
  
First querying all transactions to an object with ID of `X`

### Users 
Wallets should be associated with usernames 
### Multi-wallet Login
Created 

## Vulnerabilities
The integrity of the system is based on sequential updates, but there is currently no way to access transactions' block timestamps. Thus, we are left to rely on the client-defined `Date-Time` transaction tags. Transaction records with non-sequential `Date-Time` tags are filtered out during the data model's query process, but there is still an attack vector with respect to relational data models whose queries are executed in separate environments, as their transactions cannot be easily compared for chronological integrity.
A possible client-side solution would be to initially request all app transactions (ordered by date by default), store them in a shared context, then attach respective `Date-Time`'s and validate the full transaction ledger's chronology as they come through.

## Propaganda 
  div
    p
      br
      | Loomchat is a forum that 
      b Google cannot read
      | .
      br
      | Mail that 
      b cannot be censored
      | .
      br
      | Mail that 
      b cannot be lost
      | .
      br
        | Weavemail is mail that 
        b you own
        | .
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
