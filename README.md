# discordKit
DiscordKit is a client-side integration for PluralKit.

### Features:
- Retrieve PluralKit system information
- Retrieve other system's information
- Activate autoproxy in member mode for the current guild
- Deactivate autoproxy in current guild or DMs
- Autoproxy changes the banner colour, display name, and bio.

### To-do:
- [x] Replace pkapi.js with a simple api class
- [x] Add prefix to commands (`/pk;[command]`)
- [ ] Get avatar uploads working
- [x] Save autoproxy settings to plugin settings to allow persistence
- [ ] Front and latch modes for autoproxy
- [ ] Help command
- [ ] Look into if implementing the rest of the commands is worth the tech debt

### Commands:
- `/pk;system [id]`
  - No args: Grabs current system info
  - `id`: PluralKit System ID, Discord username or user ID
- `/pk;autoproxy mode`
  - `mode`: Off, Front or Latch
    - *Front and latch not implemented yet*
- `/pk;autoproxy member`
  - `member`: PluralKit member ID or name