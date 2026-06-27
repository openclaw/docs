---
read_when:
    - Como adicionar uma nova capacidade central e superfície de registro de Plugin
    - Decidindo se o código pertence ao core, a um plugin de fornecedor ou a um plugin de recurso
    - Conectando um novo helper de runtime para canais ou ferramentas
sidebarTitle: Adding capabilities
summary: Guia do colaborador para adicionar um novo recurso compartilhado ao sistema de Plugins do OpenClaw
title: Adicionando recursos (guia do contribuidor)
x-i18n:
    generated_at: "2026-06-27T17:44:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Este é um **guia para colaboradores** para desenvolvedores do núcleo do OpenClaw. Se você está
  criando um plugin externo, consulte [Criando plugins](/pt-BR/plugins/building-plugins)
  em vez disso. Para a referência aprofundada de arquitetura (modelo de capacidade, propriedade,
  pipeline de carregamento, auxiliares de runtime), consulte [Internos de Plugin](/pt-BR/plugins/architecture).
</Info>

Use isto quando o OpenClaw precisar de um novo domínio compartilhado, como embeddings, geração de
imagens, geração de vídeo ou alguma área de recurso futura apoiada por fornecedor.

A regra:

- **plugin** = limite de propriedade
- **capacidade** = contrato compartilhado do núcleo

Não comece conectando um fornecedor diretamente a um canal ou a uma ferramenta. Comece definindo a capacidade.

## Quando criar uma capacidade

Crie uma nova capacidade quando **todos** estes pontos forem verdadeiros:

1. Mais de um fornecedor poderia plausivelmente implementá-la.
2. Canais, ferramentas ou plugins de recurso devem consumi-la sem se importar com o fornecedor.
3. O núcleo precisa possuir fallback, política, configuração ou comportamento de entrega.

Se o trabalho for apenas de fornecedor e ainda não existir um contrato compartilhado, pare e defina o contrato primeiro.

## A sequência padrão

1. Defina o contrato tipado do núcleo.
2. Adicione registro de plugin para esse contrato.
3. Adicione um auxiliar de runtime compartilhado.
4. Conecte um plugin de fornecedor real como prova.
5. Migre consumidores de recurso/canal para o auxiliar de runtime.
6. Adicione testes de contrato.
7. Documente a configuração voltada ao operador e o modelo de propriedade.

## O que vai onde

**Núcleo:**

- Tipos de solicitação/resposta.
- Registro de provedores + resolução.
- Comportamento de fallback.
- Esquema de configuração com metadados de documentação `title` / `description` propagados em nós de objeto aninhado, curinga, item de array e composição.
- Superfície de auxiliar de runtime.

**Plugin de fornecedor:**

- Chamadas à API do fornecedor.
- Tratamento de autenticação do fornecedor.
- Normalização de solicitação específica do fornecedor.
- Registro da implementação da capacidade.

**Plugin de recurso/canal:**

- Chama `api.runtime.*` ou o auxiliar correspondente de `plugin-sdk/*-runtime`.
- Nunca chama uma implementação de fornecedor diretamente.

## Seams de provedor e harness

Use **hooks de provedor** quando o comportamento pertencer ao contrato do provedor de modelo em vez do loop genérico do agente. Exemplos incluem parâmetros de solicitação específicos do provedor após a seleção de transporte, preferência de perfil de autenticação, sobreposições de prompt e roteamento de fallback de acompanhamento após failover de modelo/perfil.

Use **hooks de harness de agente** quando o comportamento pertencer ao runtime que está executando um turno. Harnesses podem classificar resultados explícitos de protocolo, como saída vazia, reasoning sem saída visível ou um plano estruturado sem uma resposta final, para que a política externa de fallback do modelo possa tomar a decisão de nova tentativa.

Mantenha ambos os seams estreitos:

- O núcleo possui a política de nova tentativa/fallback.
- Plugins de provedor possuem dicas específicas do provedor para solicitação/autenticação/roteamento.
- Plugins de harness possuem a classificação de tentativa específica do runtime.
- Plugins de terceiros retornam dicas, não mutações diretas do estado do núcleo.

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
- Um ou mais pacotes de plugin agrupados.
- Configuração, documentação, testes.

## Exemplo prático: geração de imagens

A geração de imagens segue o formato padrão:

1. O núcleo define `ImageGenerationProvider`.
2. O núcleo expõe `registerImageGenerationProvider(...)`.
3. O núcleo expõe `runtime.imageGeneration.generate(...)`.
4. Os plugins `openai`, `google`, `fal` e `minimax` registram implementações apoiadas por fornecedores.
5. Fornecedores futuros registram o mesmo contrato sem alterar canais/ferramentas.

A chave de configuração é intencionalmente separada do roteamento de análise de visão:

- `agents.defaults.imageModel` analisa imagens.
- `agents.defaults.imageGenerationModel` gera imagens.

Mantenha essas chaves separadas para que fallback e política continuem explícitos.

## Provedores de embedding

Use `embeddingProviders` para provedores reutilizáveis de embedding vetorial. Este contrato
é intencionalmente mais amplo do que memória: ferramentas, busca, recuperação, importadores ou
plugins de recurso futuros podem consumir embeddings sem depender do mecanismo de memória.

A busca de memória pode consumir `embeddingProviders` genéricos. O contrato mais antigo
`memoryEmbeddingProviders` é uma compatibilidade obsoleta enquanto os provedores
específicos de memória existentes migram; novos provedores reutilizáveis de embedding devem usar
`embeddingProviders`.

## Checklist de revisão

Antes de lançar uma nova capacidade, verifique:

- Nenhum canal/ferramenta importa código de fornecedor diretamente.
- O auxiliar de runtime é o caminho compartilhado.
- Pelo menos um teste de contrato afirma a propriedade agrupada.
- A documentação de configuração nomeia o novo modelo/chave de configuração.
- A documentação de plugins explica o limite de propriedade.

Se um PR pular a camada de capacidade e codificar rigidamente o comportamento do fornecedor em um canal/ferramenta, devolva-o e defina o contrato primeiro.

## Relacionados

- [Internos de Plugin](/pt-BR/plugins/architecture) — modelo de capacidade, propriedade, pipeline de carregamento, auxiliares de runtime.
- [Criando plugins](/pt-BR/plugins/building-plugins) — tutorial do primeiro plugin.
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do mapa de importação e da API de registro.
- [Criando Skills](/pt-BR/tools/creating-skills) — superfície complementar para colaboradores.
