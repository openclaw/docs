---
read_when:
    - Vuoi sapere che cosa significa npm shrinkwrap in una release di OpenClaw
    - Stai esaminando i file di lock dei pacchetti, le modifiche alle dipendenze o il rischio della catena di fornitura
    - Stai validando i pacchetti npm root o Plugin prima della pubblicazione
summary: Spiegazione in linguaggio semplice e tecnica di npm shrinkwrap nei rilasci di OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:35:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

I checkout sorgente di OpenClaw usano `pnpm-lock.yaml`. I pacchetti npm
pubblicati di OpenClaw usano `npm-shrinkwrap.json`, il lockfile delle dipendenze
pubblicabile di npm, quindi le installazioni dei pacchetti usano il grafo delle
dipendenze revisionato durante il rilascio.

## La versione semplice

Shrinkwrap è una ricevuta per l'albero delle dipendenze distribuito con un pacchetto npm.
Indica a npm quali versioni esatte dei pacchetti transitivi installare.

Per i rilasci di OpenClaw, questo significa che:

- il pacchetto pubblicato non chiede a npm di inventare un nuovo grafo delle dipendenze al
  momento dell'installazione;
- le modifiche alle dipendenze diventano più facili da revisionare perché compaiono in un lockfile;
- la validazione del rilascio può testare lo stesso grafo che gli utenti installeranno;
- le sorprese legate alla dimensione del pacchetto o alle dipendenze native sono più facili da individuare prima della
  pubblicazione.

Shrinkwrap non è una sandbox. Non rende una dipendenza sicura di per sé e
non sostituisce l'isolamento dell'host, `openclaw security audit`, la provenienza dei pacchetti
o gli smoke test di installazione.

Il modello mentale breve:

| File                  | Dove conta               | Cosa significa                   |
| --------------------- | ------------------------ | -------------------------------- |
| `pnpm-lock.yaml`      | checkout sorgente OpenClaw | Grafo delle dipendenze dei maintainer |
| `npm-shrinkwrap.json` | Pacchetto npm pubblicato | Grafo di installazione npm per gli utenti |
| `package-lock.json`   | App npm locali           | Non è il contratto di pubblicazione di OpenClaw |

## Perché OpenClaw lo usa

OpenClaw è un Gateway, host di Plugin, router di modelli e runtime di agenti. Un'installazione predefinita
può influire sul tempo di avvio, sull'uso del disco, sui download di pacchetti nativi e
sull'esposizione alla supply chain.

Shrinkwrap offre alla revisione del rilascio un confine stabile:

- i revisori possono vedere il movimento delle dipendenze transitive;
- i validatori dei pacchetti possono rifiutare derive inattese del lockfile;
- l'accettazione del pacchetto può testare le installazioni con il grafo che verrà distribuito;
- i pacchetti Plugin possono portare il proprio grafo delle dipendenze bloccato invece di
  fare affidamento sul pacchetto root per possedere le dipendenze solo del Plugin.

L'obiettivo non è "più lockfile". L'obiettivo sono installazioni di rilascio riproducibili
con proprietà chiara.

## Dettagli tecnici

Il pacchetto npm root `openclaw` e i pacchetti Plugin npm di proprietà OpenClaw includono
`npm-shrinkwrap.json` quando vengono pubblicati. I pacchetti Plugin di proprietà OpenClaw idonei
possono anche essere pubblicati con `bundledDependencies` esplicite, così i file delle dipendenze
di runtime vengono trasportati nel tarball del Plugin invece di dipendere solo dalla
risoluzione in fase di installazione.

Mantieni il confine così:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Il generatore risolve il formato lock pubblicabile di npm ma rifiuta le versioni dei pacchetti
generate che non sono già presenti in `pnpm-lock.yaml`. Questo mantiene intatti
l'età delle dipendenze pnpm, gli override e il confine di revisione delle patch.

Usa i comandi solo root solo quando aggiorni intenzionalmente il pacchetto root
senza toccare i pacchetti Plugin:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

Revisiona questi file come sensibili alla sicurezza:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- payload delle dipendenze dei Plugin in bundle
- qualsiasi diff di `package-lock.json`

I validatori dei pacchetti OpenClaw richiedono shrinkwrap nei nuovi tarball del pacchetto root.
Il percorso di pubblicazione npm del Plugin controlla lo shrinkwrap locale del Plugin, installa
le dipendenze in bundle locali del pacchetto e poi esegue il pack o pubblica. I validatori dei pacchetti
rifiutano `package-lock.json` per i pacchetti OpenClaw pubblicati.

Per ispezionare un pacchetto root pubblicato:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Per ispezionare un pacchetto Plugin di proprietà OpenClaw:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Contesto: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
