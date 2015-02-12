#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
PS1='[\u@\h \W]\$ '

# MPD daemon start (if no other user instance exists)
#[ ! -s ~/.config/mpd/pid ] && mpd ~/.config/mpd/mpd.conf

archey

alias hc='herbstclient'
alias wifi='sudo wifi-menu wlp3s0'
alias webstorm='/opt/webstorm/bin/webstorm.sh'
