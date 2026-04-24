---
read_when:
    - Você quer analisar PDFs a partir de agentes
    - Você precisa dos parâmetros e limites exatos da ferramenta pdf
    - Você está depurando o modo PDF nativo vs o fallback de extração
summary: Analisar um ou mais documentos PDF com suporte nativo do provedor e fallback de extração
title: Ferramenta PDF
x-i18n:
    generated_at: "2026-04-24T06:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analisa um ou mais documentos PDF e retorna texto.

Comportamento rápido:

- Modo nativo do provedor para provedores de modelo Anthropic e Google.
- Modo de fallback por extração para outros provedores (extrai primeiro o texto, depois imagens de páginas quando necessário).
- Oferece suporte a entrada única (`pdf`) ou múltipla (`pdfs`), máximo de 10 PDFs por chamada.

## Disponibilidade

A ferramenta só é registrada quando o OpenClaw consegue resolver uma configuração de modelo com capacidade de PDF para o agente:

1. `agents.defaults.pdfModel`
2. fallback para `agents.defaults.imageModel`
3. fallback para o modelo resolvido da sessão/padrão do agente
4. se provedores de PDF nativo tiverem suporte de autenticação, prefira-os antes de candidatos genéricos de fallback de imagem

Se nenhum modelo utilizável puder ser resolvido, a ferramenta `pdf` não é exposta.

Observações sobre disponibilidade:

- A cadeia de fallback é sensível à autenticação. Um `provider/model` configurado só conta se
  o OpenClaw puder realmente autenticar esse provedor para o agente.
- Atualmente, os provedores de PDF nativo são **Anthropic** e **Google**.
- Se o provedor resolvido da sessão/padrão já tiver um modelo de vision/PDF configurado, a ferramenta PDF o reutiliza antes de recorrer a outros provedores com suporte de autenticação.

## Referência de entrada

<ParamField path="pdf" type="string">
Um caminho ou URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Vários caminhos ou URLs de PDF, até 10 no total.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt de análise.
</ParamField>

<ParamField path="pages" type="string">
Filtro de páginas como `1-5` ou `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Substituição opcional de modelo no formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite de tamanho por PDF em MB. Usa por padrão `agents.defaults.pdfMaxBytesMb` ou `10`.
</ParamField>

Observações sobre entrada:

- `pdf` e `pdfs` são mesclados e deduplicados antes do carregamento.
- Se nenhuma entrada de PDF for fornecida, a ferramenta retorna erro.
- `pages` é parseado como números de página baseados em 1, deduplicados, ordenados e limitados ao máximo de páginas configurado.
- `maxBytesMb` usa por padrão `agents.defaults.pdfMaxBytesMb` ou `10`.

## Referências de PDF compatíveis

- caminho de arquivo local (incluindo expansão de `~`)
- URL `file://`
- URL `http://` e `https://`

Observações sobre referências:

- Outros esquemas de URI (por exemplo `ftp://`) são rejeitados com `unsupported_pdf_reference`.
- No modo sandbox, URLs remotas `http(s)` são rejeitadas.
- Com a política de arquivo apenas do workspace habilitada, caminhos de arquivo local fora das raízes permitidas são rejeitados.

## Modos de execução

### Modo nativo do provedor

O modo nativo é usado para o provedor `anthropic` e `google`.
A ferramenta envia bytes brutos do PDF diretamente para as APIs do provedor.

Limites do modo nativo:

- `pages` não é compatível. Se estiver definido, a ferramenta retorna erro.
- Entrada com múltiplos PDFs é compatível; cada PDF é enviado como um bloco de documento nativo / parte inline de PDF antes do prompt.

### Modo de fallback por extração

O modo de fallback é usado para provedores não nativos.

Fluxo:

1. Extrair texto das páginas selecionadas (até `agents.defaults.pdfMaxPages`, padrão `20`).
2. Se o comprimento do texto extraído for menor que `200` caracteres, renderizar as páginas selecionadas como imagens PNG e incluí-las.
3. Enviar o conteúdo extraído mais o prompt ao modelo selecionado.

Detalhes do fallback:

- A extração de imagem de página usa um orçamento de pixels de `4,000,000`.
- Se o modelo de destino não oferecer suporte a entrada de imagem e não houver texto extraível, a ferramenta retorna erro.
- Se a extração de texto for bem-sucedida, mas a extração de imagem exigir vision em um modelo apenas de texto, o OpenClaw descarta as imagens renderizadas e continua com o texto extraído.
- O fallback de extração exige `pdfjs-dist` (e `@napi-rs/canvas` para renderização de imagem).

## Configuração

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Consulte [Referência de Configuração](/pt-BR/gateway/configuration-reference) para ver todos os detalhes dos campos.

## Detalhes da saída

A ferramenta retorna texto em `content[0].text` e metadados estruturados em `details`.

Campos comuns de `details`:

- `model`: ref de modelo resolvida (`provider/model`)
- `native`: `true` para modo nativo do provedor, `false` para fallback
- `attempts`: tentativas de fallback que falharam antes do sucesso

Campos de caminho:

- entrada de PDF único: `details.pdf`
- entrada de múltiplos PDFs: `details.pdfs[]` com entradas `pdf`
- metadados de reescrita de caminho de sandbox (quando aplicável): `rewrittenFrom`

## Comportamento de erro

- Entrada de PDF ausente: lança `pdf required: provide a path or URL to a PDF document`
- PDFs demais: retorna erro estruturado em `details.error = "too_many_pdfs"`
- Esquema de referência não compatível: retorna `details.error = "unsupported_pdf_reference"`
- Modo nativo com `pages`: lança erro claro `pages is not supported with native PDF providers`

## Exemplos

PDF único:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Múltiplos PDFs:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Modelo de fallback com filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Relacionado

- [Visão geral de ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [Referência de Configuração](/pt-BR/gateway/config-agents#agent-defaults) — configuração de pdfMaxBytesMb e pdfMaxPages
