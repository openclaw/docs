---
read_when:
    - Você está instalando, configurando ou auditando o plugin microsoft-foundry
summary: Adiciona suporte ao provedor de modelos Microsoft Foundry no OpenClaw.
title: Plugin do Microsoft Foundry
x-i18n:
    generated_at: "2026-07-12T00:12:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Adiciona ao OpenClaw suporte ao provedor de modelos Microsoft Foundry.

## Distribuição

- Pacote: `@openclaw/microsoft-foundry`
- Forma de instalação: incluído no OpenClaw

## Superfície

provedores: microsoft-foundry; contratos: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Provedor de geração de imagens: `microsoft-foundry`

## Requisitos

- Um recurso do Microsoft Foundry ou do Azure AI Foundry com implantações.
- Autenticação por chave de API por meio de `AZURE_OPENAI_API_KEY` ou de uma chave de API de provedor configurada.
- Para autenticação com o Entra ID, instale a CLI do Azure e execute `az login` antes
  da configuração inicial. O OpenClaw atualiza os tokens de runtime do Microsoft Foundry por meio de
  `az account get-access-token`.

## Modelos de chat

As implantações de chat do Microsoft Foundry usam a referência de modelo do provedor
`microsoft-foundry/<deployment-name>`. A configuração inicial descobre recursos e
implantações do Foundry com a CLI do Azure e grava o nome da implantação selecionada
na configuração do modelo.

O OpenClaw usa o endpoint `/openai/v1` do Foundry para APIs de chat compatíveis
com a OpenAI:

- As famílias de modelos GPT, `o*`, `computer-use-preview` e DeepSeek-V4 usam
  `openai-responses` por padrão.
- O MAI-DS-R1 e outras implantações de conclusão de chat usam `openai-completions`,
  a menos que uma API compatível explícita esteja configurada.
- O MAI-DS-R1 é registrado como compatível com raciocínio por meio do conteúdo de raciocínio, e não
  por meio de `reasoning_effort`. Os metadados de tokens de contexto e saída são de
  163.840 tokens.

As implantações do Anthropic Claude no Microsoft Foundry usam o formato da API
Anthropic Messages, e não o formato compatível com a OpenAI em `/openai/v1`. Configure-as como um
provedor `anthropic-messages` personalizado até que o Plugin Microsoft Foundry tenha um
runtime nativo da Anthropic. Quando o nome da implantação do Foundry for diferente do
ID do modelo Claude, defina `params.canonicalModelId` na entrada do modelo para que o OpenClaw
possa aplicar contratos de comunicação específicos do modelo, mapear `/think off` corretamente e
preservar com segurança o pensamento assinado.

## Geração de imagens com MAI

O Plugin registra `microsoft-foundry` para `image_generate` com os modelos atuais
de imagem da Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Use o nome de uma implantação de imagens MAI implantada como referência do modelo. O provedor
não declara um modelo de imagem padrão porque a API MAI exige o nome da sua implantação
no campo `model` da solicitação:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

A geração somente por prompt chama o endpoint de gerações MAI do Microsoft Foundry:
`/mai/v1/images/generations`. As edições com imagem de referência chamam
`/mai/v1/images/edits` e são limitadas às implantações `MAI-Image-2.5-Flash` e
`MAI-Image-2.5`.

A geração somente por prompt pode usar um nome de implantação personalizado apenas com o endpoint
do Foundry configurado. Para edições de imagem com um nome de implantação personalizado, selecione a
implantação durante a configuração inicial ou inclua metadados do modelo para que o OpenClaw possa verificar
se a implantação é baseada em `MAI-Image-2.5-Flash` ou `MAI-Image-2.5`.

Restrições de imagem do MAI:

- Saída: uma imagem PNG por solicitação.
- Tamanho: padrão `1024x1024`; tanto a largura quanto a altura devem ter pelo menos 768 px.
- Total de pixels: largura × altura deve ser de, no máximo, 1.048.576.
- Edições: uma imagem de entrada PNG ou JPEG.
- Dicas compartilhadas incompatíveis, como `aspectRatio`, `resolution`, `quality`,
  `background` e valores de `outputFormat` diferentes de PNG não são enviadas ao Microsoft Foundry.

## Solução de problemas

- `az: command not found`: instale a CLI do Azure ou use autenticação por chave de API.
- `Microsoft Foundry endpoint missing for MAI image generation`: selecione uma
  implantação do Foundry durante a configuração inicial ou adicione `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: o modelo de imagem selecionado aponta para uma
  implantação que não é MAI. Use um modelo de imagem MAI implantado para `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
