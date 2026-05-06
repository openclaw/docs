---
read_when:
    - Adicionando uma nova capacidade do núcleo e uma superfície de registro de Plugin
    - Decidir se o código pertence ao núcleo, a um Plugin de fornecedor ou a um Plugin de funcionalidade
    - Conectando um novo auxiliar de ambiente de execução para canais ou ferramentas
sidebarTitle: Adding capabilities
summary: Guia de colaborador para adicionar uma nova capacidade compartilhada ao sistema de Plugins do OpenClaw
title: Adicionando capacidades (guia do colaborador)
x-i18n:
    generated_at: "2026-05-06T09:06:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Este é um **guia de contribuição** para desenvolvedores do núcleo do OpenClaw. Se você está
  criando um plugin externo, consulte [Criando plugins](/pt-BR/plugins/building-plugins)
  em vez disso. Para a referência aprofundada de arquitetura (modelo de capacidades, propriedade,
  pipeline de carregamento, auxiliares de tempo de execução), consulte [Detalhes internos de Plugin](/pt-BR/plugins/architecture).
</Info>

Use isto quando o OpenClaw precisar de um novo domínio compartilhado, como geração de imagens, geração de vídeo ou alguma futura área de recursos apoiada por fornecedor.

A regra:

- **plugin** = limite de propriedade
- **capacidade** = contrato compartilhado do núcleo

Não comece conectando um fornecedor diretamente a um canal ou a uma ferramenta. Comece definindo a capacidade.

## Quando criar uma capacidade

Crie uma nova capacidade quando **todas** estas condições forem verdadeiras:

1. Mais de um fornecedor poderia implementá-la de forma plausível.
2. Canais, ferramentas ou plugins de recursos devem consumi-la sem se importar com o fornecedor.
3. O núcleo precisa ser responsável por fallback, política, configuração ou comportamento de entrega.

Se o trabalho for exclusivo de fornecedor e ainda não existir um contrato compartilhado, pare e defina o contrato primeiro.

## A sequência padrão

1. Defina o contrato tipado do núcleo.
2. Adicione o registro de plugin para esse contrato.
3. Adicione um auxiliar compartilhado de tempo de execução.
4. Conecte um plugin de fornecedor real como prova.
5. Mova consumidores de recursos/canais para o auxiliar de tempo de execução.
6. Adicione testes de contrato.
7. Documente a configuração voltada ao operador e o modelo de propriedade.

## O que fica onde

**Núcleo:**

- Tipos de solicitação/resposta.
- Registro de provedores + resolução.
- Comportamento de fallback.
- Esquema de configuração com metadados de documentação `title` / `description` propagados em nós de objeto aninhado, curinga, item de array e composição.
- Superfície do auxiliar de tempo de execução.

**Plugin de fornecedor:**

- Chamadas de API do fornecedor.
- Tratamento de autenticação do fornecedor.
- Normalização de solicitação específica do fornecedor.
- Registro da implementação da capacidade.

**Plugin de recurso/canal:**

- Chama `api.runtime.*` ou o auxiliar `plugin-sdk/*-runtime` correspondente.
- Nunca chama diretamente uma implementação de fornecedor.

## Seams de provedor e harness

Use **hooks de provedor** quando o comportamento pertencer ao contrato do provedor de modelo, e não ao loop genérico do agente. Exemplos incluem parâmetros de solicitação específicos do provedor após a seleção de transporte, preferência de perfil de autenticação, sobreposições de prompt e roteamento de fallback de acompanhamento após failover de modelo/perfil.

Use **hooks de harness de agente** quando o comportamento pertencer ao tempo de execução que está executando um turno. Harnesses podem classificar resultados de tentativa bem-sucedidos, mas inutilizáveis, como respostas vazias, somente de raciocínio ou somente de planejamento, para que a política externa de fallback de modelo possa tomar a decisão de nova tentativa.

Mantenha ambos os seams estreitos:

- O núcleo é responsável pela política de nova tentativa/fallback.
- Plugins de provedor são responsáveis por dicas específicas de solicitação/autenticação/roteamento do provedor.
- Plugins de harness são responsáveis pela classificação de tentativa específica do tempo de execução.
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
- Um ou mais pacotes de plugins incluídos.
- Configuração, documentação, testes.

## Exemplo trabalhado: geração de imagens

A geração de imagens segue o formato padrão:

1. O núcleo define `ImageGenerationProvider`.
2. O núcleo expõe `registerImageGenerationProvider(...)`.
3. O núcleo expõe `runtime.imageGeneration.generate(...)`.
4. Os plugins `openai`, `google`, `fal` e `minimax` registram implementações apoiadas por fornecedores.
5. Fornecedores futuros registram o mesmo contrato sem alterar canais/ferramentas.

A chave de configuração é intencionalmente separada do roteamento de análise de visão:

- `agents.defaults.imageModel` analisa imagens.
- `agents.defaults.imageGenerationModel` gera imagens.

Mantenha essas opções separadas para que fallback e política permaneçam explícitos.

## Checklist de revisão

Antes de entregar uma nova capacidade, verifique:

- Nenhum canal/ferramenta importa código de fornecedor diretamente.
- O auxiliar de tempo de execução é o caminho compartilhado.
- Pelo menos um teste de contrato afirma a propriedade incluída.
- A documentação de configuração nomeia o novo modelo/chave de configuração.
- A documentação de Plugin explica o limite de propriedade.

Se um PR pular a camada de capacidade e codificar rigidamente o comportamento do fornecedor em um canal/ferramenta, devolva-o e defina o contrato primeiro.

## Relacionados

- [Detalhes internos de Plugin](/pt-BR/plugins/architecture) — modelo de capacidades, propriedade, pipeline de carregamento, auxiliares de tempo de execução.
- [Criando plugins](/pt-BR/plugins/building-plugins) — tutorial do primeiro plugin.
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — mapa de importação e referência da API de registro.
- [Criando Skills](/pt-BR/tools/creating-skills) — superfície complementar para contribuidores.
