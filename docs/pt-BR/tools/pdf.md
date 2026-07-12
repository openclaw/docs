---
read_when:
    - Você quer analisar PDFs de agentes
    - Você precisa dos parâmetros e limites exatos da ferramenta de PDF
    - Você está depurando o modo nativo de PDF em comparação com o fallback de extração
summary: Analise um ou mais documentos PDF com suporte nativo do provedor e extração como alternativa
title: Ferramenta de PDF
x-i18n:
    generated_at: "2026-07-12T15:43:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analisa um ou mais documentos PDF e retorna texto. Ele usa a entrada nativa de documentos nos modelos da Anthropic e do Google e recorre à extração de texto/imagem para todos os outros provedores.

## Disponibilidade

A ferramenta só é registrada quando o OpenClaw consegue resolver um modelo compatível com PDF para o agente. Ordem de resolução:

1. `agents.defaults.pdfModel` (modelo principal/fallbacks explícitos)
2. `agents.defaults.imageModel` (modelo principal/fallbacks explícitos)
3. O modelo resolvido da sessão/padrão do agente, se o provedor oferecer suporte à entrada nativa de PDF (Anthropic, Google) ou já tiver um modelo de visão configurado
4. Provedores compatíveis com imagem/visão detectados automaticamente e com autenticação utilizável, priorizando primeiro os provedores com PDF nativo

A autenticação de cada candidato a fallback é verificada antes do uso, portanto, um `provider/model` configurado só é considerado se o OpenClaw conseguir autenticar esse provedor para o agente. Se nenhum modelo utilizável for resolvido, a ferramenta `pdf` não será disponibilizada.

## Referência de entrada

<ParamField path="pdf" type="string">
Um caminho ou URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Vários caminhos ou URLs de PDF, até um total de 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analise este documento PDF.">
Prompt de análise.
</ParamField>

<ParamField path="pages" type="string">
Filtro de páginas, como `1-5` ou `1,3,7-9`. Não é compatível com o modo de provedor nativo.
</ParamField>

<ParamField path="password" type="string">
Senha para PDFs criptografados. Aplica-se a todos os PDFs da solicitação; usada somente pelo modo de fallback de extração.
</ParamField>

<ParamField path="model" type="string">
Substituição opcional do modelo no formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite de tamanho por PDF em MB. O padrão é `agents.defaults.pdfMaxBytesMb` ou `10`, se não estiver definido.
</ParamField>

Observações:

- `pdf` e `pdfs` são combinados e desduplicados antes do carregamento; pelo menos um deles é obrigatório.
- `pages` é interpretado como números de página começando em 1, desduplicados, ordenados e limitados a `agents.defaults.pdfMaxPages` (padrão `20`). Um intervalo que não corresponda a nenhuma página dentro dos limites gera um erro antes da chamada ao modelo.

## Referências de PDF compatíveis

- Caminho de arquivo local (incluindo expansão de `~`)
- URL `file://`
- URL `http://` e `https://`
- Referências de entrada gerenciadas pelo OpenClaw, como `media://inbound/<id>`

Outros esquemas de URI (por exemplo, `ftp://`) retornam `details.error = "unsupported_pdf_reference"`. URLs `http(s)` remotas são rejeitadas quando a ferramenta é executada em sandbox. Com a política de arquivos restrita ao workspace habilitada, caminhos locais fora das raízes permitidas são rejeitados; referências de entrada gerenciadas e caminhos reproduzidos no armazenamento de mídia de entrada do OpenClaw continuam permitidos.

## Modos de execução

### Modo de provedor nativo

Usado para os provedores `anthropic` e `google` (os únicos provedores que atualmente declaram suporte nativo a documentos PDF). Os bytes brutos do PDF são enviados diretamente à API do provedor como uma parte nativa de documento/PDF embutido para cada arquivo.

Limites:

- `pages` não é compatível; se definido, a ferramenta gera `pages is not supported with native PDF providers`.
- `password` não é compatível; se definido, a ferramenta gera `password is not supported with native PDF providers`. Use um modelo não nativo para PDFs criptografados.

### Modo de fallback de extração

Usado para todos os outros provedores.

1. Extrai o texto das páginas selecionadas (até `agents.defaults.pdfMaxPages`, padrão `20`) por meio do plugin `document-extract` incluído, que usa o pacote `clawpdf` (PDFium WebAssembly) para extração de texto e imagens.
2. Se o texto extraído tiver menos de `200` caracteres, renderiza as mesmas páginas como imagens PNG. O orçamento de renderização é de `4,000,000` pixels no total, compartilhado entre todas as páginas que precisam de imagens (alocado proporcionalmente por página restante, não por página), portanto, páginas de texto que já tenham texto suficiente não são renderizadas.
3. Envia o texto extraído (e quaisquer imagens renderizadas), junto com o prompt, ao modelo selecionado.

Detalhes:

- PDFs criptografados são abertos com o parâmetro `password` de nível superior.
- Se o modelo não aceitar entrada de imagem e não houver texto extraível, a ferramenta gera um erro.
- Se a renderização de imagens falhar, o OpenClaw descarta as imagens e continua com o texto extraído.
- Se o modelo de destino aceitar somente texto e a extração tiver produzido imagens, o OpenClaw descarta as imagens e envia somente o texto.

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

| Chave                           | Padrão        | Significado                                                                                                        |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `agents.defaults.pdfModel`      | não definido  | Modelos PDF principal/fallbacks explícitos; usa `imageModel` como fallback e, depois, o modelo da sessão.           |
| `agents.defaults.pdfMaxBytesMb` | `10`          | Limite de tamanho por PDF em MB.                                                                                   |
| `agents.defaults.pdfMaxPages`   | `20`          | Número máximo de páginas processadas por PDF.                                                                      |

Consulte a [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) para obter todos os detalhes dos campos.

## Detalhes da saída

A ferramenta retorna texto em `content[0].text` e metadados estruturados em `details`.

Campos comuns de `details`:

- `model`: referência do modelo resolvido (`provider/model`)
- `native`: `true` para o modo de provedor nativo, `false` para fallback
- `attempts`: tentativas de fallback que falharam antes do sucesso

Campos de caminho:

- Entrada de um único PDF: `details.pdf`
- Entradas de vários PDFs: `details.pdfs[]` com entradas `pdf`
- Metadados de reescrita de caminho da sandbox (quando aplicável): `rewrittenFrom`

## Comportamento de erros

| Condição                          | Resultado                                                      |
| --------------------------------- | -------------------------------------------------------------- |
| Nenhuma entrada de PDF            | Gera `pdf required: provide a path or URL to a PDF document`    |
| Mais de 10 PDFs                   | `details.error = "too_many_pdfs"`                               |
| Esquema de referência incompatível | `details.error = "unsupported_pdf_reference"`                  |
| `pages` com um provedor nativo    | Gera `pages is not supported with native PDF providers`         |
| `password` com um provedor nativo | Gera `password is not supported with native PDF providers`      |

## Exemplos

Um único PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Resuma este relatório em 5 tópicos"
}
```

Vários PDFs:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare os riscos e as alterações no cronograma entre os dois documentos"
}
```

Modelo de fallback com filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extraia somente os incidentes que afetam os clientes"
}
```

PDF criptografado com fallback de extração:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Resuma este contrato"
}
```

## Relacionados

- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) - configuração de pdfMaxBytesMb e pdfMaxPages
