---
read_when:
    - Vuoi sapere cosa significa lo shrinkwrap di npm in una release di OpenClaw
    - Stai esaminando i file di lock dei pacchetti, le modifiche alle dipendenze o i rischi per la catena di fornitura
    - Stai convalidando i pacchetti npm principali o dei Plugin prima della pubblicazione
summary: Spiegazione semplice e tecnica dello shrinkwrap di npm nelle release di OpenClaw
title: shrinkwrap di npm
x-i18n:
    generated_at: "2026-07-12T07:06:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

I checkout del codice sorgente di OpenClaw utilizzano `pnpm-lock.yaml`. I pacchetti npm OpenClaw pubblicati utilizzano `npm-shrinkwrap.json`, il lockfile delle dipendenze pubblicabile di npm, così le installazioni dei pacchetti usano il grafo delle dipendenze verificato durante il rilascio.

## Perché è importante

Lo shrinkwrap è una ricevuta dell'albero delle dipendenze distribuito con un pacchetto npm: indica a npm quali versioni transitive esatte installare.

| File                  | Dove è rilevante                 | Cosa significa                              |
| --------------------- | -------------------------------- | ------------------------------------------- |
| `pnpm-lock.yaml`      | Checkout del sorgente OpenClaw   | Grafo delle dipendenze dei manutentori      |
| `npm-shrinkwrap.json` | Pacchetto npm pubblicato         | Grafo di installazione npm per gli utenti   |
| `package-lock.json`   | Applicazioni npm locali          | Non è il contratto di pubblicazione OpenClaw |

Per i rilasci di OpenClaw ciò significa che:

- il pacchetto pubblicato non chiede a npm di creare un nuovo grafo delle dipendenze al momento dell'installazione;
- le modifiche alle dipendenze sono verificabili perché vengono incluse nella differenza di un lockfile;
- la convalida del rilascio verifica lo stesso grafo che gli utenti installeranno;
- eventuali sorprese relative alle dimensioni del pacchetto o alle dipendenze native emergono prima della pubblicazione.

Lo shrinkwrap non è una sandbox. Non rende una dipendenza sicura di per sé e non sostituisce l'isolamento dell'host, `openclaw security audit`, la provenienza dei pacchetti o gli smoke test di installazione.

OpenClaw è un Gateway, un host di Plugin, un router di modelli e un runtime per agenti, quindi un'installazione predefinita influisce sul tempo di avvio, sull'utilizzo del disco, sui download dei pacchetti nativi e sull'esposizione alla catena di approvvigionamento. Lo shrinkwrap offre alla revisione del rilascio un confine stabile: i revisori vedono gli spostamenti delle dipendenze transitive, i validatori rifiutano variazioni impreviste del lockfile e i pacchetti Plugin includono il proprio grafo delle dipendenze bloccato anziché dipendere dal pacchetto radice.

## Generazione e verifica

Il pacchetto npm radice `openclaw`, i pacchetti Plugin npm di proprietà di OpenClaw (ad esempio `@openclaw/discord`) e i pacchetti pubblicabili dell'area di lavoro, come [`@openclaw/ai`](/reference/openclaw-ai), includono `npm-shrinkwrap.json` quando vengono pubblicati. Le dipendenze dell'area di lavoro sono omesse dallo shrinkwrap radice perché vengono pubblicate insieme al pacchetto radice; ogni pacchetto pubblicabile dell'area di lavoro blocca invece il proprio albero transitivo. Anche i pacchetti Plugin idonei possono essere pubblicati con `bundledDependencies` esplicite, includendo i file delle dipendenze di runtime nel tarball del Plugin anziché affidarsi esclusivamente alla risoluzione in fase di installazione.

```bash
# Tutti i pacchetti gestiti tramite shrinkwrap (radice + Plugin pubblicabili)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Solo il pacchetto radice
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Solo i pacchetti interessati dall'insieme di modifiche corrente
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Il generatore risolve il formato di lock pubblicabile di npm, ma rifiuta le versioni generate dei pacchetti che non sono già presenti in `pnpm-lock.yaml`. Ciò mantiene inalterato il confine di revisione relativo all'età delle dipendenze pnpm, agli override e alle patch.

Considerare i seguenti elementi sensibili dal punto di vista della sicurezza:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- payload delle dipendenze dei Plugin incluse
- qualsiasi differenza di `package-lock.json`

I validatori dei pacchetti OpenClaw richiedono lo shrinkwrap nei nuovi tarball del pacchetto radice e rifiutano `package-lock.json` per i pacchetti pubblicati. Il flusso di pubblicazione npm dei Plugin verifica lo shrinkwrap locale del Plugin, installa le dipendenze incluse locali del pacchetto, quindi crea il pacchetto o lo pubblica.

## Ispezione di un pacchetto pubblicato

Pacchetto radice:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Pacchetto Plugin:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Approfondimento: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
