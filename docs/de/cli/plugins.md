---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Fehler beim Laden von Plugins debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T01:51:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

Verwalten Sie Gateway-Plugins, Hook-Packs und kompatible Bundles.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflisten, Aktualisieren, Deinstallieren und Veröffentlichen.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Bundle-Kompatibilitätsmodell.
  </Card>
  <Card title="Plugin-Manifest" href="/de/plugins/manifest">
    Manifestfelder und Konfigurationsschema.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security">
    Sicherheits-Hardening für Plugin-Installationen.
  </Card>
</CardGroup>

## Befehle

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Für die Untersuchung langsamer Installations-, Inspect-, Deinstallations- oder Registry-Aktualisierungsvorgänge führen Sie den
Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasenzeiten
nach stderr und hält die JSON-Ausgabe weiterhin parsbar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Mutatoren für den Plugin-Lebenszyklus deaktiviert. Verwenden Sie stattdessen die Nix-Quelle für diese Installation statt `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` oder `plugins disable`; für nix-openclaw verwenden Sie den agent-first [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem Inline-JSON-Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche Listen-/Info-Ausgaben zeigen außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Fähigkeiten.
</Note>

### Installieren

```bash
openclaw plugins search "calendar"                   # ClawHub-Plugins suchen
openclaw plugins install <package>                      # standardmäßig npm
openclaw plugins install clawhub:<package>              # nur ClawHub
openclaw plugins install npm:<package>                  # nur npm
openclaw plugins install npm-pack:<path.tgz>            # lokales npm-Pack mit npm-install-Semantik
openclaw plugins install git:github.com/<owner>/<repo>  # Git-Repository
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # vorhandene Installation überschreiben
openclaw plugins install <package> --pin                # Version pinnen
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # lokaler Pfad
openclaw plugins install <plugin>@<marketplace>         # Marketplace
openclaw plugins install <plugin> --marketplace <name>  # Marketplace (explizit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Nackte Paketnamen werden während der Launch-Umstellung standardmäßig von npm installiert. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt
installationsbereite Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete,
keine Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Distributions- und Discovery-Oberfläche für die meisten Plugins. Npm
bleibt ein unterstützter Fallback und direkter Installationspfad. OpenClaw-eigene
`@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie
auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im
[Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`.
Installationen und Aktualisierungen im Beta-Kanal bevorzugen den npm-`beta`-Dist-Tag, wenn dieser Tag
verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurations-Includes und Reparatur ungültiger Konfiguration">
    Wenn Ihr `plugins`-Abschnitt durch ein einzeiliges `$include` gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit benachbarten Overrides schlagen geschlossen fehl, statt abgeflacht zu werden. Siehe [Konfigurations-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Während des Gateway-Starts und Hot Reload schlägt ungültige Plugin-Konfiguration wie jede andere ungültige Konfiguration geschlossen fehl; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag in Quarantäne verschieben. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die sich ausdrücklich für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force und Neuinstallation im Vergleich zu update">
    `--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes Plugin oder Hook-Pack an Ort und Stelle. Verwenden Sie es, wenn Sie dieselbe ID absichtlich aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits nachverfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird bei `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Referenz wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine gepinnte Quelle möchten. Es wird nicht mit `--marketplace` unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation dauerhaft speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Break-Glass-Option für falsch positive Ergebnisse im integrierten Scanner für gefährlichen Code. Sie erlaubt, die Installation fortzusetzen, selbst wenn der integrierte Scanner `critical`-Befunde meldet, umgeht aber **nicht** Plugin-`before_install`-Hook-Richtlinienblockaden und umgeht **nicht** Scanfehler.

    Dieses CLI-Flag gilt für Plugin-Installations-/Aktualisierungsabläufe. Gateway-gestützte Installationen von Skill-Abhängigkeiten verwenden den entsprechenden `dangerouslyForceUnsafeInstall`-Request-Override, während `openclaw skills install` ein separater ClawHub-Skill-Download-/Installationsablauf bleibt.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub](/de/tools/clawhub).

  </Accordion>
  <Accordion title="Hook-Packs und npm-Spezifikationen">
    `plugins install` ist auch die Installationsoberfläche für Hook-Packs, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung pro Hook, nicht für Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname plus optionale **exakte Version** oder **Dist-Tag**). Git-/URL-/Dateispezifikationen und SemVer-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen projektlokal mit `--ignore-scripts`, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat. Verwaltete Plugin-npm-Roots erben die npm-`overrides` auf Paketebene von OpenClaw, sodass Host-Sicherheits-Pins auch für gehoistete Plugin-Abhängigkeiten gelten.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Nackte Paketspezifikationen installieren während der Launch-Umstellung ebenfalls direkt von npm.

    Nackte Spezifikationen und `@latest` bleiben auf dem stabilen Track. Legacy-OpenClaw-Korrekturversionen wie `2026.5.3-1` werden für diese Prüfung weiterhin als stabile Releases behandelt, damit ältere Pakete sicher weiter aktualisiert werden. Neue monatliche Support-Line-Arbeit soll normale SemVer-Patchnummern statt Bindestrich-Korrektursuffixen verwenden. Wenn npm eine Standard-Line-Spezifikation zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` zu entscheiden.

    Wenn eine nackte Installationsspezifikation mit einer offiziellen Plugin-ID übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite scoped Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, Tag oder Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Referenz aus, wenn vorhanden, und verwenden dann den normalen Installer für das Plugin-Verzeichnis. Das bedeutet, Manifestvalidierung, Scannen auf gefährlichen Code, Installationsarbeit des Paketmanagers und Installationsdatensätze verhalten sich wie npm-Installationen. Aufgezeichnete Git-Installationen enthalten die Quell-URL/-Referenz plus den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Verwenden Sie nach der Installation aus Git `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu überprüfen. Wenn das Plugin mit `api.registerCli` einen CLI-Root registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-Pack-Tarball ist und Sie
    denselben verwalteten npm-Root-Installationspfad testen möchten, der von Registry-Installationen verwendet wird,
    einschließlich `package-lock.json`-Verifizierung, Scannen gehoisteter Abhängigkeiten und
    npm-Installationsdatensätzen. Einfache Archivpfade installieren weiterhin als lokale Archive
    unter dem Plugin-Erweiterungs-Root.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Nackte npm-sichere Plugin-Spezifikationen installieren während der Launch-Umstellung standardmäßig von npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um die reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft die beworbene Plugin-API / Mindestkompatibilität mit dem Gateway vor der Installation. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es anschließend über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den Legacy-Paketarchiv-Verifizierungspfad installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, die Artefaktart, npm-Integrität, npm-shasum, den Tarball-Namen und ClawPack-Digest-Fakten für spätere Aktualisierungen.
Nicht versionierte ClawHub-Installationen behalten eine nicht versionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gebunden.

#### Marketplace-Kurzform

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marketplace-Quelle explizit übergeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - ein Claude-Name für bekannte Marketplaces aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marketplace-Stamm oder `marketplace.json`-Pfad
    - eine GitHub-Repository-Kurzform wie `owner/repo`
    - eine GitHub-Repository-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Bei Remote-Marketplaces, die von GitHub oder git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repository und lehnt HTTP(S)-, absolute Pfad-, git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standardlayout für Claude-Komponenten)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden im normalen Plugin-Stamm installiert und nehmen am gleichen Ablauf für Auflisten/Info/Aktivieren/Deaktivieren teil. Derzeit werden Bundle-Skills, Claude-Befehl-Skills, Claude-`settings.json`-Standards, Claude-`.lsp.json`- / im Manifest deklarierte `lspServers`-Standards, Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnose/Info angezeigt, sind aber noch nicht in die Runtime-Ausführung eingebunden.
</Note>

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Nur aktivierte Plugins anzeigen.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Quell-/Ursprungs-/Versions-/Aktivierungsmetadaten wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbarer Bestand plus Registry-Diagnosen und Installationsstatus von Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Planung eines Kaltstarts sichtbar ist, aber es ist keine Live-Runtime-Prüfung eines bereits laufenden Gateway-Prozesses. Nachdem Sie Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` geändert haben, starten Sie das Gateway neu, das den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder neue Hooks ausgeführt werden. Bei Remote-/Container-Deployments prüfen Sie, dass Sie den tatsächlichen `openclaw gateway run`-Kindprozess neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält für jedes Plugin den `dependencyStatus` aus `package.json`
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen entlang des normalen Node-`node_modules`-Suchpfads des Plugins vorhanden sind; es importiert keinen Plugin-Runtime-Code, führt keinen Paketmanager aus und repariert keine fehlenden Abhängigkeiten.
</Note>

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Sie prüft keinen lokalen Zustand, verändert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Runtime-Code. Suchergebnisse enthalten den ClawHub-Paketnamen, Familie, Kanal, Version, Zusammenfassung und einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das Plugin-Quellverzeichnis über den passenden paketierten Quellpfad ein, zum Beispiel `/app/extensions/synology-chat`. OpenClaw erkennt diese eingehängte Quellüberlagerung vor `/app/dist/extensions/synology-chat`; ein schlicht kopiertes Quellverzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin das kompilierte dist verwenden.

Für das Debugging von Runtime-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Die Runtime-Inspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um Legacy-Abhängigkeitszustand zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, die von der Konfiguration referenziert werden.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Dienst-/Prozesshinweise, den Konfigurationspfad und die RPC-Integrität.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, anstatt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungebunden bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Zustand, keine Benutzerkonfiguration. Installationen und Aktualisierungen schreiben sie nach `plugins/installs.json` unter dem aktiven OpenClaw-Zustandsverzeichnis. Die oberste `installRecords`-Map ist die dauerhafte Quelle für Installationsmetadaten, einschließlich Datensätzen für defekte oder fehlende Plugin-Manifeste. Das `plugins`-Array ist der aus Manifesten abgeleitete Kalt-Registry-Cache. Die Datei enthält eine Nicht-bearbeiten-Warnung und wird von `openclaw plugins update`, Deinstallation, Diagnosen und der kalten Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte Legacy-`plugins.installs`-Datensätze in der Konfiguration sieht, behandeln Runtime-Lesevorgänge sie als Kompatibilitätseingabe, ohne `openclaw.json` neu zu schreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Datensätze in den Plugin-Index und entfernen den Konfigurationsschlüssel, wenn Konfigurationsschreibvorgänge erlaubt sind; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationsdatensätze erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem persistierten Plugin-Index, Plugin-Allow-/Deny-List-Einträgen und verknüpften `plugins.load.paths`-Einträgen, sofern zutreffend. Wenn `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das nachverfolgte verwaltete Installationsverzeichnis, wenn es innerhalb des Plugin-Erweiterungsstamms von OpenClaw liegt. Bei Active Memory-Plugins wird der Memory-Slot auf `memory-core` zurückgesetzt.

<Note>
`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.
</Note>

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualisierungen gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und für nachverfolgte Hook-Pack-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin wieder. Das bedeutet, dass zuvor gespeicherte dist-tags wie `@beta` und exakt gebundene Versionen bei späteren `update <id>`-Läufen weiter verwendet werden.

    Für npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem dist-tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den nachverfolgten Plugin-Datensatz auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige ID-basierte Aktualisierungen auf.

    Wenn Sie den npm-Paketnamen ohne Version oder Tag übergeben, wird er ebenfalls zurück auf den nachverfolgten Plugin-Datensatz aufgelöst. Verwenden Sie dies, wenn ein Plugin an eine exakte Version gebunden war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` verwendet die nachverfolgte Plugin-Spezifikation wieder, sofern Sie keine neue Spezifikation übergeben. `openclaw update` kennt zusätzlich den aktiven OpenClaw-Aktualisierungskanal: Im beta-Kanal versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta` und fallen dann auf die aufgezeichnete default/latest-Spezifikation zurück, wenn kein beta-Release des Plugins existiert. Exakte Versionen und explizite Tags bleiben an diesen Selektor gebunden.

    OpenClaw stellt noch keine LTS- oder monatlichen Support-Plugin-Kanäle bereit. Geplante Arbeiten an Support-Linien werden erfordern, dass Plugin-Paket- und ClawHub-Tags derselben Support-Linie wie das Kernpaket folgen.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vor einer Live-npm-Aktualisierung prüft OpenClaw die installierte Paketversion gegen die npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits dem aufgelösten Ziel entsprechen, wird die Aktualisierung übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefaktdrift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach Bestätigung. Nicht interaktive Aktualisierungshelfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` ist auch für `plugins update` als Notfall-Override für falsch positive Treffer des integrierten Dangerous-Code-Scans während Plugin-Aktualisierungen verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtlinienblockierungen oder Blockierungen durch Scan-Fehler und gilt nur für Plugin-Aktualisierungen, nicht für Hook-Pack-Aktualisierungen.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt Identität, Ladestatus, Quelle, Manifestfähigkeiten, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und jede erkannte MCP- oder LSP-Server-Unterstützung an, ohne standardmäßig Plugin-Runtime zu importieren. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzubeziehen. Die Runtime-Inspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden als Root-`openclaw`-Befehlsgruppen installiert. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` angezeigt hat, führen Sie ihn als `openclaw <command> ...` aus; zum Beispiel kann ein Plugin, das `demo-git` registriert, mit `openclaw demo-git ping` verifiziert werden.

Jedes Plugin wird danach klassifiziert, was es zur Runtime tatsächlich registriert:

- **einfache Capability** — ein Capability-Typ (z. B. ein Plugin nur für Provider)
- **hybride Capability** — mehrere Capability-Typen (z. B. Text + Sprache + Bilder)
- **nur Hooks** — nur Hooks, keine Capabilities oder Oberflächen
- **keine Capability** — Tools/Befehle/Dienste, aber keine Capabilities

Weitere Informationen zum Capability-Modell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Audits eignet. `inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Capability-Arten, Kompatibilitätshinweise, Bundle-Capabilities und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und Kompatibilitätshinweise. Wenn alles fehlerfrei ist, gibt es `No plugin issues detected.` aus.

Wenn ein konfiguriertes Plugin auf dem Datenträger vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorhergehende Diagnose zum blockierten Plugin, etwa Pfadbesitz oder global schreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exports führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Export-Form in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte Cold-Read-Modell von OpenClaw für installierte Plugin-Identität, Aktivierung, Quellmetadaten und Beitragszuständigkeit. Normaler Start, Provider-Owner-Lookup, Klassifizierung der Channel-Einrichtung und Plugin-Inventar können daraus lesen, ohne Plugin-Runtime-Module zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistenten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Runtime-Aktivierungspfad.

`openclaw doctor --fix` repariert auch Registry-nahe Abweichungen verwalteter npm-Pakete: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Paket unter dem verwalteten Plugin-npm-Root ein gebündeltes Plugin überschattet, entfernt Doctor dieses veraltete Paket und baut die Registry neu auf, damit der Start gegen das gebündelte Manifest validiert.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfallwiederherstellung beim Start vorgesehen, während die Migration ausgerollt wird.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace List akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt das aufgelöste Quelllabel sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [Community-Plugins](/de/plugins/community)
