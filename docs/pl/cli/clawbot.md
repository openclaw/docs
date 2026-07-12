---
read_when:
    - Utrzymujesz starsze skrypty korzystające z `openclaw clawbot ...`
    - Potrzebujesz wskazówek dotyczących migracji do aktualnych poleceń
summary: Dokumentacja CLI dla `openclaw clawbot` (przestrzeń nazw starszego aliasu)
title: Clawbot
x-i18n:
    generated_at: "2026-07-12T14:53:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6baf9b4e9bbe8bb31cdc4923c38cd45a883b6e5be921a403335e257dacdc2cd5
    source_path: cli/clawbot.md
    workflow: 16
---

# `openclaw clawbot`

Przestrzeń nazw starszego aliasu zachowana w celu zapewnienia zgodności wstecznej. Rejestruje to samo polecenie QR co CLI najwyższego poziomu, dlatego `openclaw clawbot qr` akceptuje wszystkie flagi polecenia [`openclaw qr`](/pl/cli/qr).

## Migracja

Zalecane jest nowoczesne polecenie najwyższego poziomu:

- `openclaw clawbot qr` -> `openclaw qr`

## Powiązane

- [Dokumentacja CLI](/pl/cli)
