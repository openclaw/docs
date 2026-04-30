---
read_when:
    - Alterando a renderização da saída do assistente na Interface de Controle
    - Depuração de diretivas de apresentação de `[embed ...]`, `MEDIA:`, resposta ou áudio
summary: Protocolo de códigos curtos de saída enriquecida para incorporações, mídia, dicas de áudio e respostas
title: Protocolo de saída rica
x-i18n:
    generated_at: "2026-04-30T10:07:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

A saída do assistente pode carregar um pequeno conjunto de diretivas de entrega/renderização:

- `MEDIA:` para entrega de anexos
- `[[audio_as_voice]]` para dicas de apresentação de áudio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadados de resposta
- `[embed ...]` para renderização rica da Control UI

Anexos `MEDIA:` remotos devem ser URLs `https:` públicas. `http:` simples,
loopback, link-local, privados e nomes de host internos são ignorados como diretivas
de anexo; buscadores de mídia no lado do servidor ainda aplicam suas próprias proteções de rede.

A sintaxe simples de imagem em Markdown permanece como texto por padrão. Canais que intencionalmente
mapeiam respostas de imagem em Markdown para anexos de mídia fazem opt-in em seu adaptador
de saída; o Telegram faz isso para que `![alt](url)` ainda possa se tornar uma resposta de mídia.

Essas diretivas são separadas. `MEDIA:` e tags de resposta/voz permanecem como metadados de entrega; `[embed ...]` é o caminho de renderização rica exclusivo da web.
Mídia confiável de resultado de ferramenta usa o mesmo parser `MEDIA:` / `[[audio_as_voice]]` antes da entrega, então saídas de ferramentas em texto ainda podem marcar um anexo de áudio como uma nota de voz.

Quando o streaming de blocos está ativado, `MEDIA:` permanece como metadado de entrega única para um
turno. Se a mesma URL de mídia for enviada em um bloco transmitido por streaming e repetida no payload final
do assistente, o OpenClaw entrega o anexo uma vez e remove a duplicata
do payload final.

## `[embed ...]`

`[embed ...]` é a única sintaxe de renderização rica voltada ao agente para a Control UI.

Exemplo de fechamento automático:

```text
[embed ref="cv_123" title="Status" /]
```

Regras:

- `[view ...]` não é mais válido para novas saídas.
- Shortcodes de embed são renderizados apenas na superfície de mensagem do assistente.
- Apenas embeds baseados em URL são renderizados. Use `ref="..."` ou `url="..."`.
- Shortcodes de embed HTML inline em formato de bloco não são renderizados.
- A UI web remove o shortcode do texto visível e renderiza o embed inline.
- `MEDIA:` não é um alias de embed e não deve ser usado para renderização rica de embed.

## Formato de renderização armazenado

O bloco de conteúdo normalizado/armazenado do assistente é um item `canvas` estruturado:

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

Blocos ricos armazenados/renderizados usam este formato `canvas` diretamente. `present_view` não é reconhecido.

## Relacionado

- [adaptadores RPC](/pt-BR/reference/rpc)
- [Typebox](/pt-BR/concepts/typebox)
