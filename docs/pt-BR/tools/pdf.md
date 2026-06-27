---
read_when:
    - Você quer analisar PDFs de agentes
    - Você precisa dos parâmetros e limites exatos da ferramenta de PDF
    - Você está depurando o modo PDF nativo versus o fallback de extração
summary: Analise um ou mais documentos PDF com suporte nativo do provedor e fallback de extração
title: Ferramenta de PDF
x-i18n:
    generated_at: "2026-06-27T18:17:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analisa um ou mais documentos PDF e retorna texto.

Comportamento rápido:

- Modo de provedor nativo para provedores de modelo Anthropic e Google.
- Modo de fallback de extração para outros provedores (extrai o texto primeiro e, depois, imagens das páginas quando necessário).
- Aceita entrada única (`pdf`) ou múltipla (`pdfs`), com máximo de 10 PDFs por chamada.

## Disponibilidade

A ferramenta só é registrada quando o OpenClaw consegue resolver uma configuração de modelo compatível com PDF para o agente:

1. `agents.defaults.pdfModel`
2. fallback para `agents.defaults.imageModel`
3. fallback para o modelo resolvido de sessão/padrão do agente
4. se provedores de PDF nativo forem respaldados por autenticação, prefira-os antes de candidatos genéricos de fallback de imagem

Se nenhum modelo utilizável puder ser resolvido, a ferramenta `pdf` não é exposta.

Notas de disponibilidade:

- A cadeia de fallback considera autenticação. Um `provider/model` configurado só conta se
  o OpenClaw conseguir autenticar esse provedor para o agente.
- Os provedores de PDF nativo atualmente são **Anthropic** e **Google**.
- Se o provedor resolvido de sessão/padrão já tiver um modelo de visão/PDF
  configurado, a ferramenta PDF reutiliza esse modelo antes de recorrer a outros
  provedores respaldados por autenticação.

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

<ParamField path="password" type="string">
Senha para PDFs criptografados no modo de fallback de extração.
</ParamField>

<ParamField path="model" type="string">
Substituição opcional de modelo no formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite de tamanho por PDF em MB. O padrão é `agents.defaults.pdfMaxBytesMb` ou `10`.
</ParamField>

Notas de entrada:

- `pdf` e `pdfs` são mesclados e deduplicados antes do carregamento.
- Se nenhuma entrada de PDF for fornecida, a ferramenta retorna erro.
- `pages` é interpretado como números de página iniciados em 1, deduplicados, ordenados e limitados ao máximo de páginas configurado.
- `password` se aplica a todos os PDFs na solicitação e é usado apenas pelo modo de fallback de extração.
- `maxBytesMb` usa como padrão `agents.defaults.pdfMaxBytesMb` ou `10`.

## Referências de PDF aceitas

- caminho de arquivo local (incluindo expansão de `~`)
- URL `file://`
- URL `http://` e `https://`
- refs de entrada gerenciadas pelo OpenClaw, como `media://inbound/<id>`

Notas de referência:

- Outros esquemas de URI (por exemplo, `ftp://`) são rejeitados com `unsupported_pdf_reference`.
- No modo sandbox, URLs remotas `http(s)` são rejeitadas.
- Com a política de arquivos restrita ao workspace habilitada, caminhos de arquivo locais fora das raízes permitidas são rejeitados.
- Refs de entrada gerenciadas e caminhos reproduzidos no armazenamento de mídia de entrada do OpenClaw são permitidos com a política de arquivos restrita ao workspace.

## Modos de execução

### Modo de provedor nativo

O modo nativo é usado para os provedores `anthropic` e `google`.
A ferramenta envia bytes brutos do PDF diretamente para as APIs do provedor.

Limites do modo nativo:

- `pages` não é aceito. Se definido, a ferramenta retorna um erro.
- `password` não é aceito. Use um modelo não nativo para analisar PDFs criptografados.
- Entrada com múltiplos PDFs é aceita; cada PDF é enviado como um bloco de documento nativo /
  parte de PDF inline antes do prompt.

### Modo de fallback de extração

O modo de fallback é usado para provedores não nativos.

Fluxo:

1. Extrai texto das páginas selecionadas (até `agents.defaults.pdfMaxPages`, padrão `20`).
2. Se o comprimento do texto extraído for menor que `200` caracteres, renderiza as páginas selecionadas como imagens PNG e as inclui.
3. Envia o conteúdo extraído mais o prompt para o modelo selecionado.

Detalhes do fallback:

- A extração de imagens de páginas usa um orçamento de pixels de `4,000,000`.
- PDFs criptografados podem ser abertos com o parâmetro de nível superior `password`.
- Se o modelo de destino não aceitar entrada de imagem e não houver texto extraível, a ferramenta retorna erro.
- Se a extração de texto for bem-sucedida, mas a extração de imagens exigir visão em um
  modelo somente texto, o OpenClaw descarta as imagens renderizadas e continua com o
  texto extraído.
- O fallback de extração usa o Plugin `document-extract` incluído. O Plugin é dono do
  `clawpdf`, que fornece extração de texto e renderização de imagens por meio do PDFium
  WebAssembly.

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

Consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference) para detalhes completos dos campos.

## Detalhes de saída

A ferramenta retorna texto em `content[0].text` e metadados estruturados em `details`.

Campos comuns de `details`:

- `model`: ref do modelo resolvido (`provider/model`)
- `native`: `true` para modo de provedor nativo, `false` para fallback
- `attempts`: tentativas de fallback que falharam antes do sucesso

Campos de caminho:

- entrada de PDF único: `details.pdf`
- entradas de múltiplos PDFs: `details.pdfs[]` com entradas `pdf`
- metadados de reescrita de caminho do sandbox (quando aplicável): `rewrittenFrom`

## Comportamento de erro

- Entrada de PDF ausente: lança `pdf required: provide a path or URL to a PDF document`
- PDFs demais: retorna erro estruturado em `details.error = "too_many_pdfs"`
- Esquema de referência sem suporte: retorna `details.error = "unsupported_pdf_reference"`
- Modo nativo com `pages`: lança um erro claro `pages is not supported with native PDF providers`

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

PDF criptografado com fallback de extração:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) - configuração de pdfMaxBytesMb e pdfMaxPages
