---
read_when:
    - Geheime verwijzingen opnieuw omzetten tijdens runtime
    - Platte-tekstresten en niet-opgeloste verwijzingen controleren
    - SecretRefs configureren en eenrichtingsopschoningswijzigingen toepassen
summary: CLI-referentie voor `openclaw secrets` (herladen, controleren, configureren, toepassen)
title: Geheimen
x-i18n:
    generated_at: "2026-07-12T08:44:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Beheer SecretRefs en houd de actieve runtime-snapshot gezond.

| Opdracht     | Rol                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`     | Gateway-RPC (`secrets.reload`): lost verwijzingen opnieuw op en vervangt de runtime-snapshot alleen bij volledig succes (zonder configuratie te schrijven)                                                           |
| `audit`      | Alleen-lezen-scan van configuratie-, authenticatie- en gegenereerde modelopslag en verouderde restanten op platte tekst, niet-opgeloste verwijzingen en afwijkingen in prioriteit (exec-verwijzingen worden overgeslagen tenzij `--allow-exec`) |
| `configure`  | Interactieve planner voor providerconfiguratie, doeltoewijzing en preflight (vereist een TTY)                                                                                                                        |
| `apply`      | Voert een opgeslagen plan uit (`--dry-run` valideert alleen en slaat exec-controles standaard over; de schrijfmodus weigert plannen met exec tenzij `--allow-exec` is opgegeven) en verwijdert daarna gerichte restanten in platte tekst |

Aanbevolen routine voor beheerders:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Als uw plan `exec`-SecretRefs/providers bevat, geeft u `--allow-exec` door aan zowel de dry-run- als de schrijfopdracht voor `apply`.

Afsluitcodes voor CI/controles:

- `audit --check` retourneert `1` bij bevindingen.
- Niet-opgeloste verwijzingen retourneren `2` (ongeacht `--check`).

Gerelateerd: [Geheimenbeheer](/nl/gateway/secrets) · [Oppervlak voor SecretRef-referenties](/nl/reference/secretref-credential-surface) · [Beveiliging](/nl/gateway/security)

## Runtime-snapshot herladen

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Gebruikt de Gateway-RPC-methode `secrets.reload`. Als het oplossen mislukt, behoudt de Gateway de laatst bekende werkende snapshot en retourneert deze een fout (geen gedeeltelijke activering). Het JSON-antwoord bevat `warningCount`.

Opties: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Audit

Scant de OpenClaw-status op:

- opslag van geheimen in platte tekst
- niet-opgeloste verwijzingen
- afwijkingen in prioriteit (`auth-profiles.json`-referenties die verwijzingen in `openclaw.json` overschrijven)
- restanten in gegenereerde `agents/*/agent/models.json`-bestanden (`apiKey`-waarden van providers en gevoelige providerheaders)
- verouderde restanten (verouderde vermeldingen in de authenticatieopslag, OAuth-herinneringen)

Detectie van gevoelige providerheaders is gebaseerd op naamheuristiek: headers worden gemarkeerd wanneer hun naam overeenkomt met veelvoorkomende fragmenten voor authenticatie/referenties (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Rapportstructuur:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- bevindingscodes: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configureren (interactieve hulp)

Stel provider- en SecretRef-wijzigingen interactief samen, voer de preflight uit en pas ze desgewenst toe:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Proces: eerst providerconfiguratie (aliassen voor `secrets.providers` toevoegen/bewerken/verwijderen), vervolgens referentietoewijzing (velden selecteren, `{source, provider, id}`-verwijzingen toewijzen), daarna de preflight en optionele toepassing.

Vlaggen:

- `--providers-only`: configureer alleen `secrets.providers` en sla referentietoewijzing over
- `--skip-provider-setup`: sla providerconfiguratie over en wijs referenties toe aan bestaande providers
- `--agent <id>`: beperk de detectie van doelen en schrijfbewerkingen voor `auth-profiles.json` tot de opslag van één agent
- `--allow-exec`: sta controles van exec-SecretRefs toe tijdens preflight/toepassing (kan provideropdrachten uitvoeren)

`--providers-only` en `--skip-provider-setup` kunnen niet worden gecombineerd.

Opmerkingen:

- Vereist een interactieve TTY.
- Richt zich op velden met geheimen in `openclaw.json` plus `auth-profiles.json` voor het geselecteerde agentbereik; canoniek ondersteund oppervlak: [Oppervlak voor SecretRef-referenties](/nl/reference/secretref-credential-surface).
- Ondersteunt het rechtstreeks maken van nieuwe `auth-profiles.json`-toewijzingen in de selectiestroom.
- Voert vóór het toepassen een preflight-oplossing uit.
- Gegenereerde plannen hebben standaard ingeschakelde opschoningsopties (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). De toepassing kan niet ongedaan worden gemaakt voor opgeschoonde waarden in platte tekst.
- Zonder `--apply` vraagt de CLI na de preflight nog steeds `Apply this plan now?`.
- Met `--apply` (en zonder `--yes`) vraagt de CLI om een extra bevestiging voor de onomkeerbare migratie.
- `--json` drukt het plan en preflightrapport af, maar vereist nog steeds een interactieve TTY.

### Veiligheid van exec-providers

Homebrew-installaties stellen vaak via symbolische koppelingen beschikbare uitvoerbare bestanden onder `/opt/homebrew/bin/*` bloot. Stel `allowSymlinkCommand: true` alleen in wanneer dit nodig is voor vertrouwde paden van pakketbeheerders, gecombineerd met `trustedDirs` (bijvoorbeeld `["/opt/homebrew"]`). Als op Windows ACL-verificatie niet beschikbaar is voor een providerpad, weigert OpenClaw uit veiligheidsoverwegingen; stel uitsluitend voor vertrouwde paden `allowInsecurePath: true` in voor die provider om de padbeveiligingscontrole te omzeilen.

## Een opgeslagen plan toepassen

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` valideert de preflight zonder bestanden te schrijven; controles van exec-SecretRefs worden tijdens een dry-run standaard overgeslagen. De schrijfmodus weigert plannen met exec-SecretRefs/providers tenzij `--allow-exec` is opgegeven. Gebruik `--allow-exec` om in een van beide modi expliciet in te stemmen met controles/uitvoering van exec-providers.

Wat `apply` kan bijwerken:

- `openclaw.json` (SecretRef-doelen + providers invoegen/bijwerken/verwijderen)
- `auth-profiles.json` (opschoning van providerdoelen)
- verouderde restanten in `auth.json`
- bekende geheime sleutels in `~/.openclaw/.env` waarvan de waarden zijn gemigreerd

Details van het plancontract (toegestane doelpaden, validatieregels, foutsemantiek): [Contract voor het toepassen van geheimenplannen](/nl/gateway/secrets-plan-contract).

### Waarom er geen back-ups voor terugdraaien zijn

`secrets apply` schrijft bewust geen back-ups voor terugdraaien die oude waarden in platte tekst bevatten. De veiligheid komt voort uit een strikte preflight en vrijwel atomaire toepassing, met bij een fout een herstelpoging in het geheugen.

## Voorbeeld

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Als `audit --check` nog steeds bevindingen voor platte tekst rapporteert, werkt u de overige gerapporteerde doelpaden bij en voert u de audit opnieuw uit.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geheimenbeheer](/nl/gateway/secrets)
- [Vault-SecretRefs](/plugins/vault)
