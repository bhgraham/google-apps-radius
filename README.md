# google-apps-radius

This is a RADIUS server that authenticates against a Google Apps domain. It was developed for use with [pfSense](https://www.pfsense.org/)'s captive portal.

## Installing

Installation can be done via [npm](https://www.npmjs.org/):

    npm install -g google-apps-radius

## Usage

    Usage: google-apps-radius --address <address> --port [port] --domain <domain> --secret <secret> --alloweddomains <alloweddomains>

    Options:
      --domain   [required]
      --secret   [required]
      --port     [default: 1812]
      --address  [default: "0.0.0.0"]
      --alloweddomains [acme.com.br,contoso.com,yourcomany.org]

## Known limitations

- Only supports RADIUS PAP (password authentication protocol)

## Author

Tim Cooper <<tim.cooper@layeh.com>>
Gustavo Maloste <<gustavomaloste@gmail.com>>

## License

GPLv3
