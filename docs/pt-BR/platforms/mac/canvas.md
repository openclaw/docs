---
read_when:
    - Implementando o painel Canvas do macOS
    - Adição de controles de agente para o espaço de trabalho visual
    - Depuração de carregamentos de canvas no WKWebView
summary: Painel Canvas controlado por agente incorporado via WKWebView + esquema de URL personalizado
title: Tela
x-i18n:
    generated_at: "2026-06-28T00:12:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

O app para macOS incorpora um **painel Canvas** controlado por agente usando `WKWebView`. Ele
é um espaço de trabalho visual leve para HTML/CSS/JS, A2UI e pequenas superfícies
de UI interativas.

## Onde o Canvas fica

O estado do Canvas é armazenado em Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

O painel Canvas serve esses arquivos por meio de um **esquema de URL personalizado**:

- `openclaw-canvas://<session>/<path>`

Exemplos:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Se não houver `index.html` na raiz, o app mostra uma **página de estrutura inicial integrada**.

## Comportamento do painel

- Painel sem bordas, redimensionável e ancorado perto da barra de menus (ou do cursor do mouse).
- Lembra o tamanho/posição por sessão.
- Recarrega automaticamente quando os arquivos locais do canvas mudam.
- Apenas um painel Canvas fica visível por vez (a sessão é alternada conforme necessário).

O Canvas pode ser desabilitado em Settings → **Allow Canvas**. Quando desabilitado, os comandos de
nó do canvas retornam `CANVAS_DISABLED`.

## Superfície da API do agente

O Canvas é exposto pelo **Gateway WebSocket**, então o agente pode:

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
- Se você passar `"/"`, o Canvas mostra a estrutura inicial local ou `index.html`.

## A2UI no Canvas

A2UI é hospedado pelo host de canvas do Gateway e renderizado dentro do painel Canvas.
Quando o Gateway anuncia um host de Canvas, o app para macOS navega automaticamente para a
página de host do A2UI na primeira abertura.

URL padrão do host A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Comandos A2UI (v0.8)

Atualmente, o Canvas aceita mensagens servidor→cliente **A2UI v0.8**:

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

## Acionando execuções de agente pelo Canvas

O Canvas pode acionar novas execuções de agente por meio de links profundos:

- `openclaw://agent?...`

Exemplo (em JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Parâmetros de consulta compatíveis:

- `message`: prompt do agente preenchido previamente.
- `sessionKey`: identificador estável de sessão.
- `thinking`: perfil de raciocínio opcional.
- `deliver`, `to` ou `channel`: destino de entrega.
- `timeoutSeconds`: tempo limite opcional da execução.
- `key`: token de segurança gerado pelo app para chamadores locais confiáveis.

O app solicita confirmação, a menos que uma chave válida seja fornecida. Links sem chave
mostram a mensagem e a URL antes da aprovação e ignoram campos de roteamento de entrega;
links com chave usam o caminho normal de execução do Gateway.

## Observações de segurança

- O esquema Canvas bloqueia travessia de diretórios; os arquivos devem ficar dentro da raiz da sessão.
- Conteúdo local do Canvas usa um esquema personalizado (nenhum servidor de loopback necessário).
- URLs externas `http(s)` são permitidas apenas quando navegadas explicitamente.

## Relacionados

- [app para macOS](/pt-BR/platforms/macos)
- [WebChat](/pt-BR/web/webchat)
