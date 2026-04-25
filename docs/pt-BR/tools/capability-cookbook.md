---
read_when:
    - Adicionando uma nova capacidade do núcleo e uma superfície de registro de Plugin
    - Decidindo se o código pertence ao núcleo, a um Plugin do fornecedor ou a um Plugin de recurso
    - Conectando um novo auxiliar de runtime para canais ou ferramentas
sidebarTitle: Adding Capabilities
summary: Guia para contribuidores sobre como adicionar uma nova capacidade compartilhada ao sistema de Plugins do OpenClaw
title: Adicionando capacidades (guia do colaborador)
x-i18n:
    generated_at: "2026-04-25T13:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Este é um **guia do colaborador** para desenvolvedores do núcleo do OpenClaw. Se você estiver
  criando um plugin externo, consulte [Building Plugins](/pt-BR/plugins/building-plugins)
  em vez disso.
</Info>

Use isto quando o OpenClaw precisar de um novo domínio, como geração de imagens, geração de vídeo
ou alguma futura área de funcionalidade sustentada por fornecedor.

A regra:

- plugin = limite de responsabilidade
- capability = contrato compartilhado do núcleo

Isso significa que você não deve começar conectando um fornecedor diretamente a um canal ou a uma
ferramenta. Comece definindo a capability.

## Quando criar uma capability

Crie uma nova capability quando tudo isto for verdadeiro:

1. mais de um fornecedor poderia plausivelmente implementá-la
2. canais, ferramentas ou plugins de recurso devem consumi-la sem se importar com
   o fornecedor
3. o núcleo precisa ser responsável por fallback, política, configuração ou comportamento de entrega

Se o trabalho for apenas de fornecedor e ainda não existir nenhum contrato compartilhado, pare e defina
primeiro o contrato.

## A sequência padrão

1. Defina o contrato tipado do núcleo.
2. Adicione o registro de plugin para esse contrato.
3. Adicione um auxiliar de runtime compartilhado.
4. Conecte um plugin de fornecedor real como prova.
5. Mova consumidores de recurso/canal para o auxiliar de runtime.
6. Adicione testes de contrato.
7. Documente a configuração voltada ao operador e o modelo de responsabilidade.

## O que vai em cada lugar

Núcleo:

- tipos de solicitação/resposta
- registro de provedores + resolução
- comportamento de fallback
- esquema de configuração mais metadados de documentação `title` / `description` propagados em nós de objeto aninhado, curinga, item de array e composição
- superfície do auxiliar de runtime

Plugin do fornecedor:

- chamadas de API do fornecedor
- tratamento de autenticação do fornecedor
- normalização de solicitação específica do fornecedor
- registro da implementação da capability

Plugin de recurso/canal:

- chama `api.runtime.*` ou o auxiliar `plugin-sdk/*-runtime` correspondente
- nunca chama diretamente uma implementação de fornecedor

## Interfaces de provider e harness

Use hooks de provider quando o comportamento pertencer ao contrato do provedor de modelo
em vez do loop genérico do agente. Exemplos incluem parâmetros de solicitação específicos do provedor após a seleção de transporte,
preferência de perfil de autenticação, sobreposições de prompt e roteamento de fallback subsequente após failover de modelo/perfil.

Use hooks de harness do agente quando o comportamento pertencer ao runtime que está
executando um turno. Harnesses podem classificar resultados de tentativa bem-sucedidos, mas inutilizáveis,
como respostas vazias, apenas de raciocínio ou apenas de planejamento, para que a política externa
de fallback de modelo possa tomar a decisão de retry.

Mantenha ambas as interfaces estreitas:

- o núcleo é responsável pela política de retry/fallback
- plugins de provider são responsáveis por dicas específicas do provedor para solicitação/autenticação/roteamento
- plugins de harness são responsáveis pela classificação de tentativas específica do runtime
- plugins de terceiros retornam dicas, não mutações diretas do estado do núcleo

## Checklist de arquivos

Para uma nova capability, espere tocar nestas áreas:

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
- um ou mais pacotes de plugin empacotados
- configuração/documentação/testes

## Exemplo: geração de imagens

A geração de imagens segue o formato padrão:

1. o núcleo define `ImageGenerationProvider`
2. o núcleo expõe `registerImageGenerationProvider(...)`
3. o núcleo expõe `runtime.imageGeneration.generate(...)`
4. os plugins `openai`, `google`, `fal` e `minimax` registram implementações sustentadas por fornecedor
5. fornecedores futuros podem registrar o mesmo contrato sem alterar canais/ferramentas

A chave de configuração é separada do roteamento de análise de visão:

- `agents.defaults.imageModel` = analisar imagens
- `agents.defaults.imageGenerationModel` = gerar imagens

Mantenha esses itens separados para que o fallback e a política continuem explícitos.

## Checklist de revisão

Antes de publicar uma nova capability, verifique:

- nenhum canal/ferramenta importa código de fornecedor diretamente
- o auxiliar de runtime é o caminho compartilhado
- pelo menos um teste de contrato valida a responsabilidade empacotada
- a documentação de configuração nomeia a nova chave de modelo/configuração
- a documentação de plugin explica o limite de responsabilidade

Se um PR ignorar a camada de capability e codificar comportamento de fornecedor diretamente em um
canal/ferramenta, devolva-o e defina primeiro o contrato.

## Relacionado

- [Plugin](/pt-BR/tools/plugin)
- [Creating skills](/pt-BR/tools/creating-skills)
- [Tools and plugins](/pt-BR/tools)
