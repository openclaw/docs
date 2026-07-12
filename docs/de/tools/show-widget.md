---
read_when:
    - Sie möchten, dass ein Agent ein interaktives Ergebnis im Webchat darstellt
    - Sie benötigen den Vertrag für Eingabe, Sicherheit oder Aufbewahrung von show_widget
sidebarTitle: Show widget
summary: Eigenständige SVG- oder HTML-Widgets direkt im Webchat darstellen
title: Widget anzeigen
x-i18n:
    generated_at: "2026-07-12T15:59:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` rendert ein eigenständiges SVG- oder HTML-Fragment inline im Chat-Transkript der Control UI. Das mitgelieferte Canvas-Plugin ist für das Tool zuständig und stellt jedes Ergebnis als Canvas-Dokument mit demselben Ursprung bereit.

Das Tool ist nur verfügbar, wenn der ursprüngliche Gateway-Client die Fähigkeit `inline-widgets` deklariert. Die Control UI deklariert diese Fähigkeit automatisch. Kanalausführungen wie Telegram und WhatsApp erhalten `show_widget` nicht.

Die Übertragung von Fähigkeiten wird für eingebettete, auf dem Codex-App-Server basierende und CLI-gestützte Modell-Backends unterstützt. Mit Berechtigungen authentifizierte MCP-Aufrufer und direkte HTTP-Tool-Aufrufer bleiben standardmäßig gesperrt, da sie keine Client-Fähigkeiten deklarieren.

## Tool verwenden

Der Agent stellt zwei erforderliche Zeichenfolgen bereit:

<ParamField path="title" type="string" required>
  Kurzer Titel, der zusammen mit der Inline-Vorschau und als Titel des bereitgestellten Dokuments angezeigt wird.
</ParamField>

<ParamField path="widget_code" type="string" required>
  Eigenständiges SVG- oder HTML-Fragment. Eingaben, die nach dem Entfernen umgebender Leerzeichen mit `<svg` beginnen, werden im SVG-Modus gerendert; alle anderen Eingaben werden als HTML-Fragment behandelt. Maximale Länge: 262.144 Zeichen.
</ParamField>

Das Tool-Ergebnis enthält ein Canvas-Vorschau-Handle, sodass der Webchat das Widget direkt aus dem Tool-Aufruf rendert und es nach dem erneuten Laden des Verlaufs wiederherstellt. Transkripte, die keine Vorschauen rendern, zeigen weiterhin den bereitgestellten Canvas-Pfad an.

## Sicherheit und Speicherung

Widget-Dokumente verwenden eine restriktive Content Security Policy: Inline-Stile und -Skripte sind zulässig, Bilder dürfen `data:`-URLs verwenden, und externe Abrufe sowie das Laden externer Ressourcen werden blockiert. Belassen Sie sämtliches Markup sowie alle Stile, Skripte und Bilddaten innerhalb von `widget_code`.

Beim iframe wird `allow-same-origin` immer weggelassen, selbst wenn der globale Einbettungsmodus der Control UI auf `trusted` gesetzt ist. Dadurch können Widget-Skripte den Ursprung der übergeordneten Anwendung nicht lesen. Der Canvas-Host stellt Widget-Dokumente außerdem mit dem Antwort-Header `Content-Security-Policy: sandbox allow-scripts` bereit. Daher wird das Widget auch beim direkten Öffnen der bereitgestellten URL in einem undurchsichtigen Ursprung statt im Ursprung der Control UI ausgeführt. Die Browser-Sandbox verhindert nicht, dass ein Skript in seinem eigenen iframe navigiert. Rendern Sie ausschließlich Widget-Code, den Sie in diesem isolierten Frame ausführen möchten.

Der iframe berücksichtigt außerdem [`gateway.controlUi.embedSandbox`](/de/web/control-ui#hosted-embeds). Die standardmäßige Stufe `scripts` unterstützt interaktive Widgets und bewahrt dabei die Ursprungsisolation.

Canvas speichert höchstens 32 Widgets pro Sitzung (oder pro Agent, wenn keine Sitzung verfügbar ist). Beim Erstellen eines weiteren Widgets wird das älteste Dokument in diesem Geltungsbereich entfernt.

## Verwandte Themen

- [Von der Control UI bereitgestellte Einbettungen](/de/web/control-ui#hosted-embeds)
- [Canvas-Plugin](/de/plugins/reference/canvas)
- [Gateway-Protokoll: Client-Fähigkeiten](/de/gateway/protocol#client-capabilities)
