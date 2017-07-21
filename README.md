# google-apps-radius

This is a RADIUS server that authenticates against a Google Apps domain. It was developed for use with [pfSense](https://www.pfsense.org/)'s captive portal.

## Installing

This version needs to be manually installed from source

## Usage

    Usage: google-apps-radius --address <address> --port [port] --secret <secret>

    Options:
      --secret   [required]
      --port     [default: 1812]
      --address  [default: "0.0.0.0"]

## Known limitations

- Only supports RADIUS PAP (password authentication protocol)

## Author

Tim Cooper <<tim.cooper@layeh.com>>

## License

GPLv3
