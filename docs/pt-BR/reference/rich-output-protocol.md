---
read_when:
    - Alterando a renderização de saída do assistente na Control UI
    - Depurando `[embed ...]`, `MEDIA:`, diretivas de reply ou apresentação de áudio
summary: Protocolo de shortcodes de saída rica para embeds, mídia, dicas de áudio e respostas
title: Protocolo de saída rica
x-i18n:
    generated_at: "2026-04-26T11:37:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

A saída do assistente pode carregar um pequeno conjunto de diretivas de entrega/renderização:

- `MEDIA:` para entrega de anexos
- `[[audio_as_voice]]` para dicas de apresentação de áudio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadados de reply
- `[embed ...]` para renderização rica na Control UI

Anexos remotos `MEDIA:` devem ser URLs públicas `https:`. `http:` simples,
loopback, link-local, privadas e hostnames internos são ignorados como diretivas
de anexo; os buscadores de mídia no lado do servidor ainda aplicam seus próprios
guards de rede.

Essas diretivas são separadas. `MEDIA:` e tags de reply/voz continuam sendo metadados de entrega; `[embed ...]` é o caminho de renderização rica apenas para a web.
Mídia de resultado de ferramenta confiável usa o mesmo parser `MEDIA:` / `[[audio_as_voice]]` antes da entrega, então saídas de ferramenta em texto ainda podem marcar um anexo de áudio como nota de voz.

Quando o block streaming está ativado, `MEDIA:` continua sendo metadado de entrega única para uma
rodada. Se a mesma URL de mídia for enviada em um bloco transmitido e repetida no payload
final do assistente, o OpenClaw entrega o anexo uma vez e remove a duplicata
do payload final.

## `[embed ...]`

`[embed ...]` é a única sintaxe de renderização rica voltada ao agente para a Control UI.

Exemplo self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

Regras:

- `[view ...]` não é mais válido para nova saída.
- Shortcodes embed são renderizados apenas na superfície de mensagem do assistente.
- Apenas embeds com suporte de URL são renderizados. Use `ref="..."` ou `url="..."`.
- Shortcodes embed em HTML inline no formato de bloco não são renderizados.
- A UI web remove o shortcode do texto visível e renderiza o embed inline.
- `MEDIA:` não é um alias de embed e não deve ser usado para renderização rica de embed.

## Formato de renderização armazenado

O bloco de conteúdo do assistente normalizado/armazenado é um item `canvas` estruturado:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Blocos ricos armazenados/renderizados usam diretamente esse formato `canvas`. `present_view` não é reconhecido.

## Relacionado

- [Adaptadores RPC](/pt-BR/reference/rpc)
- [Typebox](/pt-BR/concepts/typebox)
