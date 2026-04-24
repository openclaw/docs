---
read_when:
    - Adicionando uma nova capacidade central e superfície de registro de Plugin
    - Decidindo se o código pertence ao núcleo, a um Plugin de fornecedor ou a um Plugin de recurso
    - Conectando um novo helper de runtime para canais ou ferramentas
sidebarTitle: Adding Capabilities
summary: Guia para contribuidores adicionarem uma nova capacidade compartilhada ao sistema de Plugins do OpenClaw
title: Adicionando capacidades (guia do contribuidor)
x-i18n:
    generated_at: "2026-04-24T06:15:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1e3251b9150c9744d967e91f531dfce01435b13aea3a17088ccd54f2145d14f
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Este é um **guia para contribuidores** do núcleo do OpenClaw. Se você estiver
  criando um Plugin externo, consulte [Criando Plugins](/pt-BR/plugins/building-plugins)
  em vez disso.
</Info>

Use isto quando o OpenClaw precisar de um novo domínio, como geração de imagem, geração de vídeo ou alguma futura área de recurso respaldada por fornecedor.

A regra:

- plugin = limite de propriedade
- capability = contrato central compartilhado

Isso significa que você não deve começar conectando um fornecedor diretamente a um canal ou a uma
ferramenta. Comece definindo a capacidade.

## Quando criar uma capacidade

Crie uma nova capacidade quando todas estas condições forem verdadeiras:

1. mais de um fornecedor poderia plausivelmente implementá-la
2. canais, ferramentas ou Plugins de recurso devem consumi-la sem se preocupar com
   o fornecedor
3. o núcleo precisa controlar comportamento de fallback, política, configuração ou entrega

Se o trabalho for específico de fornecedor e ainda não existir um contrato compartilhado, pare e defina
o contrato primeiro.

## A sequência padrão

1. Defina o contrato central tipado.
2. Adicione registro de Plugin para esse contrato.
3. Adicione um helper de runtime compartilhado.
4. Conecte um Plugin de fornecedor real como prova.
5. Mova consumidores de recurso/canal para o helper de runtime.
6. Adicione testes de contrato.
7. Documente a configuração visível para o operador e o modelo de propriedade.

## O que vai para onde

Núcleo:

- tipos de solicitação/resposta
- registro de provedor + resolução
- comportamento de fallback
- schema de configuração mais metadados de documentação propagados de `title` / `description` em nós aninhados de objeto, curinga, item de array e composição
- superfície de helper de runtime

Plugin de fornecedor:

- chamadas de API do fornecedor
- tratamento de autenticação do fornecedor
- normalização específica de solicitação do fornecedor
- registro da implementação da capacidade

Plugin de recurso/canal:

- chama `api.runtime.*` ou o helper `plugin-sdk/*-runtime` correspondente
- nunca chama diretamente uma implementação de fornecedor

## Checklist de arquivos

Para uma nova capacidade, espere tocar nestas áreas:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- um ou mais pacotes de Plugins incluídos
- configuração/documentação/testes

## Exemplo: geração de imagem

A geração de imagem segue o formato padrão:

1. o núcleo define `ImageGenerationProvider`
2. o núcleo expõe `registerImageGenerationProvider(...)`
3. o núcleo expõe `runtime.imageGeneration.generate(...)`
4. os Plugins `openai`, `google`, `fal` e `minimax` registram implementações respaldadas por fornecedor
5. fornecedores futuros podem registrar o mesmo contrato sem alterar canais/ferramentas

A chave de configuração é separada do roteamento de análise de visão:

- `agents.defaults.imageModel` = analisar imagens
- `agents.defaults.imageGenerationModel` = gerar imagens

Mantenha isso separado para que fallback e política permaneçam explícitos.

## Checklist de revisão

Antes de lançar uma nova capacidade, verifique:

- nenhum canal/ferramenta importa código de fornecedor diretamente
- o helper de runtime é o caminho compartilhado
- pelo menos um teste de contrato afirma a propriedade incluída
- a documentação de configuração nomeia a nova chave de modelo/configuração
- a documentação do Plugin explica o limite de propriedade

Se um PR ignorar a camada de capacidade e codificar rigidamente comportamento de fornecedor em um
canal/ferramenta, devolva-o e defina o contrato primeiro.

## Relacionado

- [Plugin](/pt-BR/tools/plugin)
- [Criando Skills](/pt-BR/tools/creating-skills)
- [Ferramentas e Plugins](/pt-BR/tools)
