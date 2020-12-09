Virtual Escape Platform
=====================

While you're on the gaming, you can voice chat with other team member.

Installation and Deployment
======================

```html
cd virtual-escape-platform
run.bat
```

Configuration
=========

You can configure room as follow.

please go to the file.

```html
custom_html/Jitsi_Integration.js
```

You can find the line like follow.

```html
room = connection.initJitsiConference('liveroom', confOptions);
```

if you want to change the room, please change the `liveroom` to your room name.