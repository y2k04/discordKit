# discordKit
DiscordKit is a client-side integration for PluralKit.

### Current features:
- Retrieve PluralKit system information (`/pk;system`)
- Retrieve other system's information (`/pk;system id:[system id / username / user id]`)
- Activate autoproxy in member mode for the current guild (`/pk;autoproxy member:[member id / name]`)
- Deactivate autoproxy in current guild (`/pk;autoproxy mode:off`)
- Autoproxy changes the banner colour, display name, and bio.

### To-do:
- [x] Replace pkapi.js with a simple api class
- [x] Add prefix to commands (`/pk;[command]`)
- [ ] Get avatar uploads working
- [x] Save autoproxy settings to plugin settings to allow persistence
- [ ] Front and latch modes for autoproxy
- [ ] Help command
- [ ] Look into if implementing the rest of the commands is worth the tech debt
