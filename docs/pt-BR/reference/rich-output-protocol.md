---
read_when:
    - Alterando a renderização da saída do assistente na Control UI
    - Depurando `[embed ...]`, `MEDIA:`, diretivas de resposta ou de apresentação de áudio
summary: Protocolo de shortcodes de saída rica para embeds, mídia, hints de áudio e respostas
title: Protocolo de saída rica
x-i18n:
    generated_at: "2026-04-25T18:21:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e01037a8cb80c9de36effd4642701dcc86131a2b8fb236d61c687845e64189
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

A saída do assistente pode carregar um pequeno conjunto de diretivas de entrega/renderização:

- `MEDIA:` para entrega de anexo
- `[[audio_as_voice]]` para hints de apresentação de áudio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadados de resposta
- `[embed ...]` para renderização rica na Control UI

Essas diretivas são separadas. `MEDIA:` e tags de resposta/voz permanecem como metadados de entrega; `[embed ...]` é o caminho de renderização rica somente para a web.
A mídia confiável de resultado de ferramenta usa o mesmo parser `MEDIA:` / `[[audio_as_voice]]` antes da entrega, então saídas de ferramenta em texto ainda podem marcar um anexo de áudio como nota de voz.

Quando o block streaming está ativado, `MEDIA:` permanece como metadado de entrega única para um
turno. Se a mesma URL de mídia for enviada em um bloco com streaming e repetida na carga útil
final do assistente, o OpenClaw entrega o anexo uma vez e remove a duplicata
da carga útil final.

## `[embed ...]`

`[embed ...]` é a única sintaxe de renderização rica voltada ao agente para a Control UI.

Exemplo autocontido:

```text
[embed ref="cv_123" title="Status" /]
```

Regras:

- `[view ...]` não é mais válido para nova saída.
- Shortcodes de embed são renderizados apenas na superfície de mensagem do assistente.
- Apenas embeds com URL de suporte são renderizados. Use `ref="..."` ou `url="..."`.
- Shortcodes de embed em HTML inline no formato de bloco não são renderizados.
- A UI web remove o shortcode do texto visível e renderiza o embed inline.
- `MEDIA:` não é um alias de embed e não deve ser usado para renderização rica de embed.

## Formato de renderização armazenado

O bloco normalizado/armazenado de conteúdo do assistente é um item `canvas` estruturado:

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

Blocos ricos armazenados/renderizados usam diretamente este formato `canvas`. `present_view` não é reconhecido.

## Relacionado

- [RPC adapters](/pt-BR/reference/rpc)
- [Typebox](/pt-BR/concepts/typebox)
