---
read_when:
    - Alterando a renderização da saída do assistente na Control UI
    - Depurando diretivas de apresentação ``[embed ...]``, ``MEDIA:``, reply ou áudio
summary: Protocolo de shortcodes de saída avançada para embeds, mídia, dicas de áudio e respostas
title: Protocolo de saída avançada
x-i18n:
    generated_at: "2026-04-25T13:55:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

A saída do assistente pode carregar um pequeno conjunto de diretivas de entrega/renderização:

- `MEDIA:` para entrega de anexo
- `[[audio_as_voice]]` para dicas de apresentação de áudio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadados de resposta
- `[embed ...]` para renderização avançada na Control UI

Essas diretivas são separadas. `MEDIA:` e tags de resposta/voz continuam sendo metadados de entrega; `[embed ...]` é o caminho de renderização avançada apenas para a web.

Quando o streaming em blocos está habilitado, `MEDIA:` continua sendo metadado de entrega única para um
turno. Se a mesma URL de mídia for enviada em um bloco transmitido e repetida na payload final
do assistente, o OpenClaw entrega o anexo uma vez e remove a duplicata
da payload final.

## `[embed ...]`

`[embed ...]` é a única sintaxe de renderização avançada voltada ao agente para a Control UI.

Exemplo autoencerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Regras:

- `[view ...]` não é mais válido para novas saídas.
- Shortcodes de embed são renderizados apenas na superfície de mensagem do assistente.
- Apenas embeds com URL de origem são renderizados. Use `ref="..."` ou `url="..."`.
- Shortcodes de embed HTML inline em formato de bloco não são renderizados.
- A UI web remove o shortcode do texto visível e renderiza o embed inline.
- `MEDIA:` não é um alias de embed e não deve ser usado para renderização avançada de embed.

## Formato de renderização armazenado

O bloco de conteúdo do assistente normalizado/armazenado é um item estruturado `canvas`:

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

Blocos avançados armazenados/renderizados usam diretamente esse formato `canvas`. `present_view` não é reconhecido.

## Relacionado

- [Adaptadores RPC](/pt-BR/reference/rpc)
- [Typebox](/pt-BR/concepts/typebox)
