---
read_when:
    - Utilizzi il plugin voice-call e vuoi i punti di ingresso della CLI
    - Vuoi esempi rapidi per `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Riferimento CLI per `openclaw voicecall` (superficie dei comandi del Plugin per chiamate vocali)
title: Chiamata vocale
x-i18n:
    generated_at: "2026-05-01T08:29:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` è un comando fornito da un plugin. Appare solo se il plugin per le chiamate vocali è installato e abilitato.

Quando il Gateway è in esecuzione, i comandi operativi (`call`, `start`,
`continue`, `speak`, `dtmf`, `end` e `status`) vengono inviati al runtime
delle chiamate vocali di quel Gateway. Se non è raggiungibile alcun Gateway,
usano come fallback un runtime CLI autonomo.

Documento principale:

- Plugin per chiamate vocali: [Chiamata vocale](/it/plugins/voice-call)

## Comandi comuni

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

Per impostazione predefinita, `setup` stampa controlli di idoneità leggibili dalle persone. Usa `--json` per
gli script:

```bash
openclaw voicecall setup --json
```

Per impostazione predefinita, `status` stampa le chiamate attive in JSON. Passa `--call-id <id>` per ispezionare
una chiamata.

Per i provider esterni (`twilio`, `telnyx`, `plivo`), la configurazione deve risolvere un URL
Webhook pubblico da `publicUrl`, da un tunnel o dall'esposizione Tailscale. Un fallback di servizio su loopback/privato
viene rifiutato perché gli operatori non possono raggiungerlo.

`smoke` esegue gli stessi controlli di idoneità. Non effettuerà una vera chiamata telefonica
a meno che siano presenti sia `--to` sia `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Esposizione dei Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Nota di sicurezza: esponi l'endpoint Webhook solo alle reti di cui ti fidi. Preferisci Tailscale Serve a Funnel quando possibile.

## Correlati

- [Riferimento CLI](/it/cli)
- [Plugin per chiamate vocali](/it/plugins/voice-call)
