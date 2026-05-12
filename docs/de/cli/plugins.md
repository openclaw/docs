---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Fehler beim Laden von Plugins debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-12T08:45:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b51646a103e9e020f6e53cd08aa25e7291fb629741fd41bdab520d80b7416ff
    source_path: cli/plugins.md
    workflow: 16
---

Gateway-Plugins, Hook-Pakete und kompatible Bundles verwalten.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Endbenutzerleitfaden zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurzbeispiele für Installation, Auflisten, Aktualisierung, Deinstallation und Veröffentlichung.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Bundle-Kompatibilitätsmodell.
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

Führen Sie zur Untersuchung langsamer Installations-, Prüf-, Deinstallations- oder Registry-Aktualisierungsvorgänge den
Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasenzeiten
nach stderr und sorgt dafür, dass JSON-Ausgaben weiterhin parsebar bleiben. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Mutatoren für den Plugin-Lebenszyklus deaktiviert. Verwenden Sie stattdessen die Nix-Quelle für diese Installation statt `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` oder `plugins disable`; für nix-openclaw verwenden Sie den agentenzentrierten [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche list/info-Ausgaben zeigen außerdem den Bundle-Subtyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Funktionen.
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

Maintainer, die Installationen zur Einrichtungszeit testen, können automatische Plugin-Installationsquellen
mit geschützten Umgebungsvariablen überschreiben. Siehe
[Überschreibungen für Plugin-Installationen](/de/plugins/install-overrides).

<Warning>
Bloße Paketnamen installieren während der Launch-Umstellung standardmäßig aus npm. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie angeheftete Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt
installationsbereite Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete,
nicht Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Distributions- und Auffindbarkeitsfläche für die meisten Plugins. Npm
bleibt ein unterstützter Fallback und direkter Installationspfad. OpenClaw-eigene
`@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie
auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im
[Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`.
Installationen und Aktualisierungen aus dem Beta-Kanal bevorzugen den npm-`beta`-dist-tag, wenn dieses Tag
verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Config-Includes und Reparatur ungültiger Konfiguration">
    Wenn Ihr Abschnitt `plugins` durch ein einzeiliges `$include` abgesichert ist, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit benachbarten Überschreibungen schlagen geschlossen fehl, statt zusammengeführt zu werden. Siehe [Config-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Beim Gateway-Start und Hot Reload schlägt ungültige Plugin-Konfiguration wie jede andere ungültige Konfiguration geschlossen fehl; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag isolieren. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die sich explizit für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force und Neuinstallation gegenüber Aktualisierung">
    `--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes Plugin oder Hook-Paket direkt. Verwenden Sie es, wenn Sie bewusst dieselbe ID aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine bereits installierte Plugin-ID ausführen, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird mit `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Referenz wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine angeheftete Quelle möchten. Es wird mit `--marketplace` nicht unterstützt, weil Marketplace-Installationen Marketplace-Quellenmetadaten statt einer npm-Spezifikation speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Notfalloption für False Positives im integrierten Scanner für gefährlichen Code. Sie ermöglicht, dass die Installation fortgesetzt wird, auch wenn der integrierte Scanner `critical`-Funde meldet, umgeht aber **keine** Policy-Blockierungen durch Plugin-`before_install`-Hooks und umgeht **keine** Scan-Fehler.

    Dieses CLI-Flag gilt für Plugin-Installations- und Aktualisierungsabläufe. Gateway-gestützte Skill-Abhängigkeitsinstallationen verwenden die entsprechende Anforderungsüberschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` ein separater ClawHub-Download-/Installationsablauf für Skills bleibt.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub](/de/clawhub/security).

  </Accordion>
  <Accordion title="Hook-Pakete und npm-Spezifikationen">
    `plugins install` ist auch die Installationsfläche für Hook-Pakete, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung pro Hook, nicht für Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname plus optionale **exakte Version** oder **dist-tag**). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen projektnah mit `--ignore-scripts` zur Sicherheit, auch wenn Ihre Shell globale npm-Installationseinstellungen hat. Verwaltete Plugin-npm-Roots erben die npm-`overrides` auf Paketebene von OpenClaw, sodass Host-Sicherheitspins auch auf gehoistete Plugin-Abhängigkeiten angewendet werden.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Bloße Paketspezifikationen installieren während der Launch-Umstellung ebenfalls direkt aus npm.

    Bloße Spezifikationen und `@latest` bleiben auf dem stabilen Track. OpenClaw-Korrekturversionen mit Datumsstempel wie `2026.5.3-1` sind für diese Prüfung stabile Releases. Wenn npm eine davon zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` anzumelden.

    Wenn eine bloße Installationsspezifikation einer offiziellen Plugin-ID entspricht (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite scoped-Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, ein Tag oder einen Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Referenz aus, wenn vorhanden, und verwenden dann den normalen Plugin-Verzeichnisinstaller. Das bedeutet, dass Manifestvalidierung, Scannen auf gefährlichen Code, Paketmanager-Installationsarbeit und Installationsdatensätze sich wie bei npm-Installationen verhalten. Aufgezeichnete Git-Installationen enthalten die Quell-URL/-Referenz sowie den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Verwenden Sie nach der Installation aus Git `openclaw plugins inspect <id> --runtime --json`, um Runtime-Registrierungen wie Gateway-Methoden und CLI-Befehle zu überprüfen. Wenn das Plugin mit `api.registerCli` eine CLI-Root registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-pack-Tarball ist und Sie
    denselben verwalteten npm-Root-Installationspfad testen möchten, der von Registry-Installationen verwendet wird,
    einschließlich `package-lock.json`-Verifizierung, Scannen gehoisteter Abhängigkeiten und
    npm-Installationsdatensätzen. Einfache Archivpfade werden weiterhin als lokale Archive
    unter dem Plugin-Extensions-Root installiert.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bloße npm-sichere Plugin-Spezifikationen installieren während der Launch-Umstellung standardmäßig aus npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um eine reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft die beworbene Plugin-API / Mindestkompatibilität mit dem Gateway vor der Installation. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es anschließend über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den Legacy-Verifizierungspfad für Paketarchive installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-Shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Updates.
Unversionierte ClawHub-Installationen behalten eine unversionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gepinnt.

#### Marketplace-Kurzschreibweise

Verwenden Sie die Kurzschreibweise `plugin@marketplace`, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

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
  <Tab title="Marketplace-Quellen">
    - ein Claude-Name für bekannte Marketplaces aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokales Marketplace-Stammverzeichnis oder ein `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzschreibweise wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Regeln für Remote-Marketplaces">
    Bei Remote-Marketplaces, die von GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repository und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden im normalen Plugin-Stammverzeichnis installiert und nehmen am selben Auflisten/Info/Aktivieren/Deaktivieren-Ablauf teil. Derzeit werden Bundle-Skills, Claude-Befehl-Skills, Claude-`settings.json`-Standardwerte, Claude-`.lsp.json`- / manifestdeklarierte `lspServers`-Standardwerte, Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnose/Info angezeigt, sind aber noch nicht in die Runtime-Ausführung eingebunden.
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
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Dies ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Planung eines Kaltstarts sichtbar ist, aber es ist keine Live-Runtime-Prüfung eines bereits laufenden Gateway-Prozesses. Starten Sie nach Änderungen an Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` das Gateway neu, das den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Prüfen Sie bei Remote-/Container-Deployments, dass Sie den tatsächlichen `openclaw gateway run`-Kindprozess neu starten und nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält für jedes Plugin den `dependencyStatus` aus `package.json`
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen
entlang des normalen Node-`node_modules`-Suchpfads des Plugins vorhanden sind; es
importiert keinen Plugin-Runtime-Code, führt keinen Paketmanager aus und repariert
keine fehlenden Abhängigkeiten.
</Note>

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Sie prüft keinen lokalen
Zustand, ändert keine Konfiguration, installiert keine Pakete und lädt keinen
Plugin-Runtime-Code. Suchergebnisse enthalten den ClawHub-Paketnamen, Familie,
Kanal, Version, Zusammenfassung und einen Installationshinweis wie
`openclaw plugins install clawhub:<package>`.

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images hängen Sie das
Plugin-Quellverzeichnis per Bind-Mount über den passenden paketierten Quellpfad ein, z. B.
`/app/extensions/synology-chat`. OpenClaw erkennt dieses eingehängte Quell-Overlay
vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quellverzeichnis
bleibt inaktiv, sodass normale paketierte Installationen weiterhin die kompilierte Dist verwenden.

Für das Debugging von Runtime-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Die Runtime-Inspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um Legacy-Abhängigkeitszustände zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, auf die in der Konfiguration verwiesen wird.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Dienst-/Prozesshinweise, den Konfigurationspfad und die RPC-Gesundheit.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, anstatt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Zustand, keine Benutzerkonfiguration. Installationen und Updates schreiben sie in `plugins/installs.json` im aktiven OpenClaw-Zustandsverzeichnis. Die oberste `installRecords`-Map ist die dauerhafte Quelle für Installationsmetadaten, einschließlich Datensätzen für defekte oder fehlende Plugin-Manifeste. Das `plugins`-Array ist der aus Manifesten abgeleitete Kalt-Registry-Cache. Die Datei enthält eine Nicht-bearbeiten-Warnung und wird von `openclaw plugins update`, Deinstallation, Diagnosen und der Kalt-Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte Legacy-`plugins.installs`-Datensätze in der Konfiguration sieht, behandeln Runtime-Lesevorgänge sie als Kompatibilitätseingabe, ohne `openclaw.json` neu zu schreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Datensätze in den Plugin-Index und entfernen den Konfigurationsschlüssel, wenn Konfigurationsschreibvorgänge erlaubt sind; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationsdatensätze erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem persistierten Plugin-Index, Plugin-Zulassungs-/Sperrlisteneinträgen und gegebenenfalls verknüpften `plugins.load.paths`-Einträgen. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das verfolgte verwaltete Installationsverzeichnis, wenn es sich im Plugin-Erweiterungsstamm von OpenClaw befindet. Bei Active-Memory-Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

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
  <Accordion title="Plugin-ID im Vergleich zu npm-Spezifikation auflösen">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin wieder. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt gepinnte Versionen auch bei späteren `update <id>`-Läufen weiter verwendet werden.

    Für npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen auf den verfolgten Plugin-Datensatz zurück, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für künftige ID-basierte Updates auf.

    Wenn Sie den npm-Paketnamen ohne Version oder Tag übergeben, wird er ebenfalls auf den verfolgten Plugin-Datensatz zurückaufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version gepinnt war und Sie es wieder auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Updates des Beta-Kanals">
    `openclaw plugins update` verwendet die verfolgte Plugin-Spezifikation wieder, sofern Sie keine neue Spezifikation übergeben. `openclaw update` kennt zusätzlich den aktiven OpenClaw-Update-Kanal: Im Beta-Kanal versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta` und fallen dann auf die aufgezeichnete Standard-/Latest-Spezifikation zurück, wenn kein Plugin-Beta-Release existiert. Dieser Fallback wird als Warnung gemeldet und lässt das Core-Update nicht fehlschlagen. Exakte Versionen und explizite Tags bleiben an diesen Selektor gepinnt.

  </Accordion>
  <Accordion title="Versionsprüfungen und Integritätsabweichung">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen die npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits dem aufgelösten Ziel entsprechen, wird das Update übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefaktabweichung. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt nach einer Bestätigung, bevor er fortfährt. Nicht-interaktive Update-Helfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bei update">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Break-Glass-Override für falsch positive Treffer des eingebauten Scans auf gefährlichen Code während Plugin-Updates verfügbar. Es umgeht weiterhin keine Richtlinienblockaden von Plugin-`before_install` oder Blockaden durch Scan-Fehler und gilt nur für Plugin-Updates, nicht für Hook-Pack-Updates.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt Identität, Ladestatus, Quelle, Manifestfähigkeiten, Richtlinienflags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und erkannte MCP- oder LSP-Server-Unterstützung, ohne standardmäßig Plugin-Runtime zu importieren. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzubeziehen. Die Runtime-Inspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden normalerweise als Root-`openclaw`-Befehlsgruppen installiert, aber Plugins können auch verschachtelte Befehle unter einem Core-Elternbefehl wie `openclaw nodes` registrieren. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` anzeigt, führen Sie ihn unter dem aufgeführten Pfad aus; beispielsweise kann ein Plugin, das `demo-git` registriert, mit `openclaw demo-git ping` verifiziert werden.

Jedes Plugin wird danach klassifiziert, was es tatsächlich zur Runtime registriert:

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

Wenn ein konfiguriertes Plugin auf dem Datenträger vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorherige Diagnose zum blockierten Plugin, etwa Pfadbesitz oder global schreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exporten führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportform in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte Cold-Read-Modell von OpenClaw für installierte Plugin-Identität, Aktivierungsstatus, Quellmetadaten und Beitragsverantwortung. Normaler Start, Provider-Owner-Lookup, Klassifizierung der Channel-Einrichtung und Plugin-Inventar können sie lesen, ohne Plugin-Runtime-Module zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Runtime-Aktivierungspfad.

`openclaw doctor --fix` repariert außerdem Registry-nahe Drift bei verwaltetem npm: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Paket unter dem verwalteten Plugin-npm-Root ein gebündeltes Plugin überschattet, entfernt Doctor dieses veraltete Paket und baut die Registry neu auf, damit der Start gegen das gebündelte Manifest validiert. Doctor verlinkt außerdem das Host-Paket `openclaw` erneut in verwaltete npm-Plugins, die `peerDependencies.openclaw` deklarieren, sodass paketlokale Runtime-Importe wie `openclaw/plugin-sdk/*` nach Updates oder npm-Reparaturen aufgelöst werden.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfallwiederherstellung des Starts vorgesehen, während die Migration ausgerollt wird.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt die aufgelöste Quellenbezeichnung sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [ClawHub](/de/clawhub)
