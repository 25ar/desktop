#!/bin/sh
#
# ~/.xinitrc
#
# Executed by startx (run your window manager from here)

if [ -d /etc/X11/xinit/xinitrc.d ]; then
  for f in /etc/X11/xinit/xinitrc.d/*; do
    [ -x "$f" ] && . "$f"
  done
  unset f
fi
xrdb -merge ~/.Xresources 
syndaemon -t -i 1.5 -d
# exec gnome-session
# exec startkde
#exec startxfce4
# ...or the Window Manager of your choice
#exec herbstluftwm --locked
/usr/bin/start-pulseaudio-x11
exec awesome
