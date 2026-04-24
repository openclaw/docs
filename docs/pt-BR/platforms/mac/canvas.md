---
read_when:
    - Implementar o painel Canvas no macOS
    - Adicionar controles do agente para o workspace visual
    - Depurar carregamentos de canvas do WKWebView
summary: Painel Canvas controlado pelo agente incorporado via WKWebView + esquema de URL personalizado
title: Canvas
x-i18n:
    generated_at: "2026-04-24T06:01:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

O app macOS incorpora um **painel Canvas** controlado pelo agente usando `WKWebView`. Ele
é um workspace visual leve para HTML/CSS/JS, A2UI e pequenas superfícies de
interface interativa.

## Onde o Canvas fica

O estado do Canvas é armazenado em Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

O painel Canvas serve esses arquivos por meio de um **esquema de URL personalizado**:

- `openclaw-canvas://<session>/<path>`

Exemplos:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Se não existir `index.html` na raiz, o app mostra uma **página scaffold integrada**.

## Comportamento do painel

- Painel sem borda, redimensionável, ancorado perto da barra de menus (ou do cursor do mouse).
- Lembra tamanho/posição por sessão.
- Recarrega automaticamente quando arquivos locais do canvas mudam.
- Apenas um painel Canvas fica visível por vez (a sessão é alternada conforme necessário).

O Canvas pode ser desativado em Configurações → **Allow Canvas**. Quando desativado,
comandos de node do canvas retornam `CANVAS_DISABLED`.

## Superfície de API do agente

O Canvas é exposto via **Gateway WebSocket**, para que o agente possa:

- mostrar/ocultar o painel
- navegar para um caminho ou URL
- avaliar JavaScript
- capturar uma imagem de snapshot

Exemplos de CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Observações:

- `canvas.navigate` aceita **caminhos locais do canvas**, URLs `http(s)` e URLs `file://`.
- Se você passar `"/"`, o Canvas mostra o scaffold local ou `index.html`.

## A2UI no Canvas

O A2UI é hospedado pelo canvas host do Gateway e renderizado dentro do painel Canvas.
Quando o Gateway anuncia um Canvas host, o app macOS navega automaticamente para a
página host do A2UI na primeira abertura.

URL padrão do host A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Comandos A2UI (v0.8)

Atualmente, o Canvas aceita mensagens A2UI **v0.8** de servidor para cliente:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) não é compatível.

Exemplo de CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Teste rápido:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Disparar execuções do agente a partir do Canvas

O Canvas pode disparar novas execuções do agente por meio de links profundos:

- `openclaw://agent?...`

Exemplo (em JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

O app pede confirmação, a menos que uma chave válida seja fornecida.

## Observações de segurança

- O esquema do Canvas bloqueia travessia de diretório; os arquivos devem ficar sob a raiz da sessão.
- O conteúdo local do Canvas usa um esquema personalizado (sem necessidade de servidor loopback).
- URLs externas `http(s)` são permitidas apenas quando navegadas explicitamente.

## Relacionado

- [App macOS](/pt-BR/platforms/macos)
- [WebChat](/pt-BR/web/webchat)
