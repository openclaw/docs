---
read_when:
    - Implementando o painel Canvas do macOS
    - Adição de controles do agente ao espaço de trabalho visual
    - Depuração de carregamentos de canvas no WKWebView
summary: Painel Canvas controlado pelo agente, incorporado via WKWebView + esquema de URL personalizado
title: Canvas
x-i18n:
    generated_at: "2026-07-12T15:21:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

O app para macOS incorpora um **painel Canvas** controlado pelo agente usando `WKWebView`, um
espaço de trabalho visual leve para HTML/CSS/JS, A2UI e pequenas
interfaces de usuário interativas.

## Onde o Canvas fica

O estado do Canvas é armazenado no Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

O painel Canvas disponibiliza esses arquivos por meio de um esquema de URL personalizado,
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Se não houver um `index.html` na raiz, o app exibirá uma página de estrutura integrada.

## Comportamento do painel

- Painel sem bordas e redimensionável, ancorado próximo à barra de menus (ou ao cursor do mouse).
- Memoriza o tamanho e a posição de cada sessão.
- Recarrega automaticamente quando os arquivos locais do Canvas são alterados.
- Apenas um painel Canvas fica visível por vez (a sessão é alternada conforme necessário).

O Canvas pode ser desativado em Settings -> **Allow Canvas**. Quando desativado,
os comandos do Node para o Canvas retornam `CANVAS_DISABLED`.

## Superfície da API do agente

O Canvas é disponibilizado por meio do WebSocket do Gateway, permitindo que o agente mostre ou oculte o
painel, navegue até um caminho ou uma URL, avalie JavaScript e capture uma
imagem de snapshot:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` aceita caminhos locais do Canvas, URLs `http(s)` e URLs `file://`.
Passar `"/"` exibe a estrutura local ou o `index.html`.

Os destinos hospedados pelo Gateway em `/__openclaw__/canvas/` e
`/__openclaw__/a2ui/` são resolvidos por meio da URL atual do Canvas com escopo
da sessão do Node. O app atualiza essa capacidade de curta duração antes da navegação;
você não precisa criar nem copiar uma URL de capacidade por conta própria.

## A2UI no Canvas

A A2UI é hospedada pelo host do Canvas no Gateway e renderizada dentro do painel
Canvas. Quando o Gateway anuncia um host do Canvas, o app para macOS navega automaticamente
até a página do host da A2UI na primeira abertura.

A URL anunciada tem escopo de capacidade, por exemplo,
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Trate-a como credenciais efêmeras, não como um link estável.

### Comandos da A2UI (v0.8)

O Canvas aceita mensagens A2UI v0.8 do servidor para o cliente: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9) ainda
não é compatível.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Se você consegue ler isto, o envio por push da A2UI funciona."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Teste rápido de sanidade:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Olá da A2UI"
```

## Acionamento de execuções do agente pelo Canvas

O Canvas pode acionar novas execuções do agente por meio de links profundos `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Parâmetros de consulta compatíveis:

| Parâmetro                  | Significado                                               |
| -------------------------- | --------------------------------------------------------- |
| `message`                  | Prompt do agente preenchido previamente.                  |
| `sessionKey`               | Identificador estável da sessão.                          |
| `thinking`                 | Perfil de raciocínio opcional.                            |
| `deliver`, `to`, `channel` | Destino da entrega.                                       |
| `timeoutSeconds`           | Tempo limite opcional da execução.                        |
| `key`                      | Token de segurança gerado pelo app para chamadores locais confiáveis. |

O app solicita confirmação, a menos que uma chave válida seja fornecida. Links sem
chave mostram a mensagem e a URL antes da aprovação e ignoram os campos de roteamento
da entrega; links com chave usam o caminho normal de execução do Gateway.

## Observações de segurança

- O esquema do Canvas bloqueia a travessia de diretórios; os arquivos devem residir na raiz da sessão.
- O conteúdo local do Canvas usa um esquema personalizado (sem necessidade de servidor de loopback).
- URLs `http(s)` externas são permitidas apenas quando acessadas explicitamente por navegação.
- Páginas da Web comuns servem apenas para renderização. As ações do agente são aceitas somente pelo
  esquema do Canvas pertencente ao app ou pelo documento A2UI exato do Gateway com escopo de capacidade
  selecionado pelo app; subframes, redirecionamentos, capacidades expiradas e consultas
  alteradas não podem despachar ações.

## Relacionado

- [App para macOS](/pt-BR/platforms/macos)
- [WebChat](/pt-BR/web/webchat)
