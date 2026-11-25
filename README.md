# pi-morph

[Morph](https://www.morphllm.com) provider extension for [Pi](https://pi.dev).

Enables `/login morph` in Pi and exposes Morph's OpenAI-compatible open-source coding models:

- `morph-kimik3-abliterated`
- `morph-dsv41flash-abliterated`
- `morph-kimik31`
- `morph-kimik3`
- `morph-glm53-744b`
- `morph-glm52-744b`
- `morph-glm53flash`
- `morph-dsv41flash`
- `morph-dsv41flash-1017`
- `morph-dsv4flash`
- `morph-kimik3-fast`

## Install

```bash
pi install git:github.com/abhi-reducto/pi-morph
```

The package declares `@earendil-works/pi-ai` as an optional dependency so it can import the OpenAI completions API implementation; Pi supplies the host copy at runtime.

## Auth

Get an API key from [morphllm.com/dashboard/api-keys](https://www.morphllm.com/dashboard/api-keys), then run:

```bash
pi auth login morph --api-key
```

Or in the Pi TUI:

```
/login morph
```

You can also set the `MORPH_API_KEY` environment variable instead of logging in.

## Use

```
pi --provider morph --model morph-kimik3-abliterated
```

## Pricing

Prices are pulled from Morph's live API at `https://www.morphllm.com/api/models/json?prices=list`. Update the extension or fork it if pricing changes.
