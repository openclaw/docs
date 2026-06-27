---
read_when:
    - Test dei flussi di onboarding o configurazione con un plugin impacchettato localmente
    - Verificare un pacchetto Plugin prima di pubblicarlo
    - Sostituire un'installazione automatica di plugin con un artefatto di test
sidebarTitle: Install overrides
summary: Testa gli override dei plugin pacchettizzati con i flussi di installazione in fase di configurazione
title: Override di installazione dei Plugin
x-i18n:
    generated_at: "2026-06-27T17:50:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Gli override di installazione dei Plugin consentono ai manutentori di testare le installazioni dei Plugin in fase di configurazione rispetto a
un pacchetto npm specifico o a un tarball npm-pack locale. Sono destinati solo alla validazione E2E e dei pacchetti. Gli utenti normali devono installare i Plugin con
[`openclaw plugins install`](/it/cli/plugins).

<Warning>
Gli override eseguono codice del Plugin dalla fonte che fornisci. Usali solo in una
directory di stato isolata o su una macchina di test eliminabile.
</Warning>

## Ambiente

Gli override sono disabilitati a meno che entrambe le variabili siano impostate:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

La mappa degli override è JSON indicizzata per id del Plugin. I valori supportano:

- `npm:<registry-spec>` per pacchetti del registro e versioni o tag esatti
- `npm-pack:<path.tgz>` per tarball locali prodotti da `npm pack`

I percorsi relativi `npm-pack:` vengono risolti dalla directory di lavoro corrente.

## Comportamento

Quando un flusso in fase di configurazione richiede di installare un Plugin il cui id appare nella mappa,
OpenClaw usa la fonte dell'override invece del catalogo, del pacchetto incluso o della fonte npm predefinita. Questo si applica all'onboarding e ad altri flussi che usano l'installer condiviso dei Plugin in fase di configurazione.

Gli override applicano comunque l'id del Plugin previsto. Un tarball mappato a `codex`
deve installare un Plugin il cui id del manifest è `codex`.

Gli override non ereditano lo stato ufficiale di fonte attendibile. Anche quando la voce del catalogo rappresenta normalmente un pacchetto di proprietà di OpenClaw, un override viene trattato come input di test fornito dall'operatore.

I file `.env` del workspace non possono abilitare gli override di installazione. Imposta queste variabili nella shell attendibile, nel job CI o nel comando di test remoto che avvia OpenClaw.

## E2E del pacchetto

Usa una directory di stato isolata in modo che le installazioni dei pacchetti e i record di installazione non tocchino il tuo stato normale di OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifica il pacchetto installato sotto la directory di stato:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Per l'E2E con provider live, carica la vera chiave API da una shell attendibile o da un segreto CI
prima di avviare il comando di test. Non stampare le chiavi; segnala solo la fonte e
se la chiave era presente.
