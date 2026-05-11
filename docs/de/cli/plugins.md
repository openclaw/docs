---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Fehler beim Laden von Plugins debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-11T20:26:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

Gateway-Plugins, Hook-Pakete und kompatible Bundles verwalten.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Anleitung für Endbenutzer zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflisten, Aktualisierung, Deinstallation und Veröffentlichung.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Kompatibilitätsmodell für Bundles.
  </Card>
  <Card title="Plugin-Manifest" href="/de/plugins/manifest">
    Manifestfelder und Konfigurationsschema.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security">
    Sicherheitshärtung für Plugin-Installationen.
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

Führen Sie bei Untersuchungen zu langsamer Installation, Inspektion, Deinstallation oder Registry-Aktualisierung den Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasen-Timings nach stderr und hält die JSON-Ausgabe parsebar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Plugin-Lifecycle-Mutatoren deaktiviert. Verwenden Sie für diese Installation die Nix-Quelle statt `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` oder `plugins disable`; verwenden Sie für nix-openclaw den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche list/info-Ausgaben zeigen außerdem den Bundle-Subtyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Fähigkeiten.
</Note>

### Installation

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Maintainer, die Installationen zur Einrichtungszeit testen, können automatische Plugin-Installationsquellen mit geschützten Umgebungsvariablen überschreiben. Siehe [Plugin-Installationsüberschreibungen](/de/plugins/install-overrides).

<Warning>
Bloße Paketnamen werden während der Umstellung zum Start standardmäßig aus npm installiert. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt installierbare Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete, nicht Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Distributions- und Auffindbarkeitsfläche für die meisten Plugins. Npm bleibt ein unterstützter Fallback- und Direktinstallationspfad. OpenClaw-eigene `@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im [Plugin-Bestand](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`. Installationen und Aktualisierungen aus dem Beta-Kanal bevorzugen das npm-`beta`-Dist-Tag, wenn dieses Tag verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurations-Includes und Reparatur ungültiger Konfiguration">
    Wenn Ihr `plugins`-Abschnitt durch ein einzelnes Datei-`$include` gesichert ist, schreiben `plugins install/update/enable/disable/uninstall` in diese inkludierte Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit gleichrangigen Überschreibungen schlagen geschlossen fehl, statt zusammengeführt zu werden. Siehe [Konfigurations-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Beim Gateway-Start und Hot Reload schlägt ungültige Plugin-Konfiguration geschlossen fehl wie jede andere ungültige Konfiguration; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag quarantänisieren. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die sich ausdrücklich für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force und Neuinstallation vs. Aktualisierung">
    `--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes Plugin oder Hook-Paket direkt. Verwenden Sie es, wenn Sie absichtlich dieselbe ID aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine bereits installierte Plugin-ID ausführen, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird nicht mit `git:`-Installationen unterstützt; verwenden Sie eine explizite Git-Ref wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine gepinnte Quelle möchten. Es wird nicht mit `--marketplace` unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation dauerhaft speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Notfalloption für False Positives im eingebauten Scanner für gefährlichen Code. Sie erlaubt der Installation fortzufahren, selbst wenn der eingebaute Scanner `critical`-Befunde meldet, umgeht aber **keine** Policy-Sperren von Plugin-`before_install`-Hooks und **keine** Scan-Fehler.

    Dieses CLI-Flag gilt für Plugin-Installations- und Aktualisierungsabläufe. Gateway-gestützte Skill-Abhängigkeitsinstallationen verwenden die passende `dangerouslyForceUnsafeInstall`-Request-Überschreibung, während `openclaw skills install` ein separater ClawHub-Skill-Download- und Installationsablauf bleibt.

    Wenn ein Plugin, das Sie auf ClawHub veröffentlicht haben, durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub](/de/clawhub/security).

  </Accordion>
  <Accordion title="Hook-Pakete und npm-Spezifikationen">
    `plugins install` ist auch die Installationsfläche für Hook-Pakete, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung einzelner Hooks, nicht für Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname plus optionale **exakte Version** oder **Dist-Tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen projeklokal mit `--ignore-scripts` zur Sicherheit, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat. Verwaltete Plugin-npm-Roots erben die npm-`overrides` auf Paketebene von OpenClaw, sodass Host-Sicherheits-Pins auch für gehobene Plugin-Abhängigkeiten gelten.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Bloße Paket-Spezifikationen installieren während der Umstellung zum Start ebenfalls direkt aus npm.

    Bloße Spezifikationen und `@latest` bleiben auf dem stabilen Track. Datumsmarkierte OpenClaw-Korrekturversionen wie `2026.5.3-1` sind für diese Prüfung stabile Releases. Wenn npm eine davon zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` dafür zu entscheiden.

    Wenn eine bloße Installationsspezifikation einer offiziellen Plugin-ID entspricht (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizit gescopte Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen sind `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, ein Tag oder einen Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Ref aus, falls vorhanden, und verwenden dann den normalen Installer für Plugin-Verzeichnisse. Das bedeutet, Manifestvalidierung, Scannen auf gefährlichen Code, Paketmanager-Installationsarbeit und Installationsdatensätze verhalten sich wie bei npm-Installationen. Aufgezeichnete Git-Installationen enthalten die Quell-URL/Ref sowie den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Verwenden Sie nach der Installation aus Git `openclaw plugins inspect <id> --runtime --json`, um Runtime-Registrierungen wie Gateway-Methoden und CLI-Befehle zu prüfen. Wenn das Plugin einen CLI-Root mit `api.registerCli` registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-Pack-Tarball ist und Sie denselben verwalteten npm-Root-Installationspfad testen möchten, der von Registry-Installationen verwendet wird, einschließlich `package-lock.json`-Prüfung, Scannen gehobener Abhängigkeiten und npm-Installationsdatensätzen. Einfache Archivpfade installieren weiterhin als lokale Archive unter dem Plugin-Erweiterungs-Root.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bloße npm-sichere Plugin-Spezifikationen installieren während der Umstellung zum Start standardmäßig aus npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um eine reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft vor der Installation die beworbene Plugin-API / minimale Gateway-Kompatibilität. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-Pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es anschließend über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den Legacy-Verifizierungspfad für Paketarchive installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Updates.
Unversionierte ClawHub-Installationen behalten eine unversionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gebunden.

#### Marketplace-Kurzschreibweise

Verwenden Sie die Kurzschreibweise `plugin@marketplace`, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` existiert:

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
    - ein Claude-Name für einen bekannten Marketplace aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marketplace-Stamm oder `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzschreibweise wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Für Remote-Marketplaces, die aus GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repo und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standard-Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden im normalen Plugin-Stamm installiert und nehmen am selben Ablauf für Auflisten/Info/Aktivieren/Deaktivieren teil. Derzeit werden Bundle-Skills, Claude-Befehl-Skills, Claude-Standardwerte aus `settings.json`, Claude-Standardwerte aus `.lsp.json` / in Manifesten deklarierte `lspServers`, Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnosen/Info angezeigt, sind aber noch nicht in die Runtime-Ausführung eingebunden.
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
  Maschinenlesbares Inventar plus Registry-Diagnosen und Installationsstatus von Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Kaltstartplanung sichtbar ist, aber es ist keine Live-Runtime-Prüfung eines bereits laufenden Gateway-Prozesses. Nachdem Sie Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` geändert haben, starten Sie den Gateway neu, der den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Bei Remote-/Container-Deployments verifizieren Sie, dass Sie den tatsächlichen `openclaw gateway run`-Kindprozess neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält für jedes Plugin den `dependencyStatus` aus `package.json`
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen
entlang des normalen Node-`node_modules`-Suchpfads des Plugins vorhanden sind; es
importiert keinen Plugin-Runtime-Code, führt keinen Paketmanager aus und repariert
keine fehlenden Abhängigkeiten.
</Note>

`plugins search` ist eine Remote-ClawHub-Katalogabfrage. Sie prüft keinen lokalen
Status, verändert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Runtime-Code. Suchergebnisse enthalten den ClawHub-Paketnamen, Familie, Kanal, Version, Zusammenfassung und
einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für Arbeit an gebündelten Plugins innerhalb eines paketierten Docker-Images mounten Sie das Plugin-
Quellverzeichnis per Bind-Mount über den passenden paketierten Quellpfad, z. B.
`/app/extensions/synology-chat`. OpenClaw erkennt dieses gemountete Quell-
Overlay vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quell-
verzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin die kompilierten dist-Dateien verwenden.

Für das Debugging von Runtime-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Die Runtime-Inspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um Legacy-Abhängigkeitsstatus zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, die von der Konfiguration referenziert werden.
- `openclaw gateway status --deep --require-rpc` bestätigt den erreichbaren Gateway, Dienst-/Prozesshinweise, Konfigurationspfad und RPC-Integrität.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verlinkte Installationen den Quellpfad wiederverwenden, statt ein verwaltetes Installationsziel zu überschreiben.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungebunden bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Status, keine Benutzerkonfiguration. Installationen und Updates schreiben sie in `plugins/installs.json` unter dem aktiven OpenClaw-Statusverzeichnis. Die Top-Level-Map `installRecords` ist die dauerhafte Quelle für Installationsmetadaten, einschließlich Einträgen für defekte oder fehlende Plugin-Manifeste. Das Array `plugins` ist der aus Manifesten abgeleitete Kalt-Registry-Cache. Die Datei enthält eine Nicht-bearbeiten-Warnung und wird von `openclaw plugins update`, Deinstallation, Diagnosen und der Kalt-Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte Legacy-`plugins.installs`-Einträge in der Konfiguration erkennt, behandeln Runtime-Lesevorgänge sie als Kompatibilitätseingabe, ohne `openclaw.json` neu zu schreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Einträge in den Plugin-Index und entfernen den Konfigurationsschlüssel, wenn Konfigurationsschreibvorgänge erlaubt sind; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationseinträge erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, dem persistierten Plugin-Index, Plugin-Erlauben-/Verweigern-Listeneinträgen und gegebenenfalls verlinkten `plugins.load.paths`-Einträgen. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das verfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb des OpenClaw-Plugin-Erweiterungsstamms befindet. Bei Active-Memory-Plugins wird der Memory-Slot auf `memory-core` zurückgesetzt.

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

Updates gelten für verfolgte Plugin-Installationen im verwalteten Plugin-Index und verfolgte Hook-Pack-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin wieder. Das bedeutet, dass zuvor gespeicherte dist-tags wie `@beta` und exakt gebundene Versionen bei späteren `update <id>`-Durchläufen weiterverwendet werden.

    Bei npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem dist-tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den verfolgten Plugin-Eintrag auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige ID-basierte Updates auf.

    Wenn der npm-Paketname ohne Version oder Tag übergeben wird, wird er ebenfalls zurück auf den verfolgten Plugin-Eintrag aufgelöst. Verwenden Sie dies, wenn ein Plugin an eine exakte Version gebunden war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` verwendet die verfolgte Plugin-Spezifikation wieder, sofern Sie keine neue Spezifikation übergeben. `openclaw update` kennt zusätzlich den aktiven OpenClaw-Update-Kanal: Im Beta-Kanal versuchen npm- und ClawHub-Plugin-Einträge der Standardlinie zuerst `@beta` und fallen dann auf die aufgezeichnete Standard-/latest-Spezifikation zurück, wenn kein Plugin-Beta-Release existiert. Dieser Fallback wird als Warnung gemeldet und lässt das Kern-Update nicht fehlschlagen. Exakte Versionen und explizite Tags bleiben an diesen Selektor gebunden.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen die npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits dem aufgelösten Ziel entsprechen, wird das Update ohne Herunterladen, Neuinstallation oder Neuschreiben von `openclaw.json` übersprungen.

    Wenn ein gespeicherter Integritäts-Hash existiert und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefakt-Drift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach Bestätigung. Nicht interaktive Update-Helfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Notfall-Override für False Positives des integrierten Dangerous-Code-Scans während Plugin-Updates verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtlinienblockaden oder Blockaden durch Scan-Fehler und gilt nur für Plugin-Updates, nicht für Hook-Pack-Updates.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt Identität, Ladestatus, Quelle, Manifest-Fähigkeiten, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und jede erkannte MCP- oder LSP-Server-Unterstützung, ohne standardmäßig Plugin-Runtime zu importieren. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzuschließen. Die Runtime-Inspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen verbleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden normalerweise als Root-`openclaw`-Befehlsgruppen installiert, aber Plugins können auch verschachtelte Befehle unter einem Kern-Elternbefehl wie `openclaw nodes` registrieren. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` anzeigt, führen Sie ihn am aufgeführten Pfad aus; ein Plugin, das beispielsweise `demo-git` registriert, kann mit `openclaw demo-git ping` verifiziert werden.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Audits eignet. `inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Fähigkeitstypen, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Diagnose

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und Kompatibilitätshinweise. Wenn alles sauber ist, gibt es `No plugin issues detected.` aus.

Wenn ein konfiguriertes Plugin auf dem Datenträger vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorhergehende Diagnose für das blockierte Plugin, etwa Pfadbesitz oder weltweit beschreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exports führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportform in der Diagnoseausgabe einzuschließen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte Cold-Read-Modell von OpenClaw für installierte Plugin-Identität, Aktivierungsstatus, Quellmetadaten und Beitragszuständigkeit. Normaler Start, Provider-Zuständigkeitslookup, Klassifizierung der Kanal-Einrichtung und Plugin-Inventar können sie lesen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Laufzeit-Aktivierungspfad.

`openclaw doctor --fix` repariert auch Registry-nahe Drift verwalteter npm-Pakete: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Paket unter dem verwalteten npm-Stamm für Plugins ein gebündeltes Plugin überschattet, entfernt doctor dieses veraltete Paket und baut die Registry neu auf, damit der Start gegen das gebündelte Manifest validiert.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfallwiederherstellung des Starts vorgesehen, während die Migration ausgerollt wird.
</Warning>

### Marktplatz

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Die Marktplatzliste akzeptiert einen lokalen Marktplatzpfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt die aufgelöste Quellenbezeichnung sowie das geparste Marktplatzmanifest und die Plugin-Einträge aus.

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [ClawHub](/de/clawhub)
