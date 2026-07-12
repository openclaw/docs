---
read_when:
    - Adição de um novo recurso principal e de uma superfície de registro de plugins
    - Como decidir se o código pertence ao núcleo, a um plugin de fornecedor ou a um plugin de recurso
    - Conectando um novo auxiliar de runtime para canais ou ferramentas
sidebarTitle: Adding capabilities
summary: Guia do colaborador para adicionar um novo recurso compartilhado ao sistema de plugins do OpenClaw
title: Adição de recursos (guia para colaboradores)
x-i18n:
    generated_at: "2026-07-12T15:22:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Este é um **guia para colaboradores** destinado aos desenvolvedores do núcleo do OpenClaw. Se você estiver
  desenvolvendo um plugin externo, consulte [Desenvolvimento de plugins](/pt-BR/plugins/building-plugins).
  Para obter a referência detalhada da arquitetura (modelo de capacidades, propriedade,
  pipeline de carregamento, auxiliares de runtime), consulte [Aspectos internos dos plugins](/pt-BR/plugins/architecture).
</Info>

Use isto quando o OpenClaw precisar de um novo domínio compartilhado, como embeddings, geração
de imagens, geração de vídeos ou alguma futura área de recursos respaldada por fornecedores.

A regra:

- **plugin** = limite de propriedade
- **capacidade** = contrato compartilhado do núcleo

Não conecte um fornecedor diretamente a um canal ou uma ferramenta. Primeiro, defina a capacidade.

## Quando criar uma capacidade

Crie uma nova capacidade somente quando **todas** estas condições forem verdadeiras:

1. Mais de um fornecedor poderia implementá-la de maneira plausível.
2. Canais, ferramentas ou plugins de recursos devem consumi-la sem se preocupar com o fornecedor.
3. O núcleo precisa ser responsável pelo fallback, pela política, pela configuração ou pelo comportamento de entrega.

Se o trabalho for exclusivo de um fornecedor e ainda não existir um contrato compartilhado, primeiro defina o contrato.

## A sequência padrão

1. Defina o contrato tipado do núcleo.
2. Adicione o registro de plugins para esse contrato.
3. Adicione um auxiliar de runtime compartilhado.
4. Conecte um plugin de fornecedor real como comprovação.
5. Migre os consumidores de recursos/canais para o auxiliar de runtime.
6. Adicione testes de contrato.
7. Documente a configuração voltada ao operador e o modelo de propriedade.

## O que pertence a cada camada

| Camada                     | Responsabilidades                                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Núcleo**                 | Tipos de solicitação/resposta; registro e resolução de provedores; comportamento de fallback; esquema de configuração com metadados de documentação `title`/`description` propagados em nós de objetos aninhados, curingas, itens de arrays e composições; superfície de auxiliares de runtime. |
| **Plugin do fornecedor**   | Chamadas à API do fornecedor, tratamento da autenticação do fornecedor, normalização de solicitações específica do fornecedor e registro da implementação da capacidade.                                                              |
| **Plugin de recurso/canal** | Chama `api.runtime.*` ou o auxiliar `plugin-sdk/*-runtime` correspondente. Nunca chama diretamente uma implementação de fornecedor.                                                                                                    |

## Pontos de integração de provedores e harnesses

Use **hooks de provedores** quando o comportamento pertencer ao contrato do provedor de modelos, e não ao loop genérico do agente. Os exemplos incluem parâmetros de solicitação específicos do provedor após a seleção do transporte, preferência de perfil de autenticação, sobreposições de prompts e roteamento de fallback subsequente após o failover de modelo/perfil.

Use **hooks do harness do agente** quando o comportamento pertencer ao runtime que está executando um turno. Os harnesses podem classificar resultados explícitos do protocolo, como saída vazia, raciocínio sem saída visível ou um plano estruturado sem resposta final, para que a política externa de fallback do modelo possa decidir se deve tentar novamente.

Mantenha ambos os pontos de integração restritos:

- O núcleo é responsável pela política de novas tentativas/fallback.
- Os plugins de provedores são responsáveis por parâmetros de solicitação, autenticação e dicas de roteamento específicos do provedor.
- Os plugins de harness são responsáveis pela classificação de tentativas específica do runtime.
- Plugins de terceiros retornam dicas, não alterações diretas no estado do núcleo.

## Lista de verificação de arquivos

Para uma nova capacidade, espere alterar estas áreas:

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
- Configuração, documentação e testes.

## Exemplo prático: geração de imagens

A geração de imagens segue a estrutura padrão:

1. O núcleo define `ImageGenerationProvider`.
2. O núcleo expõe `registerImageGenerationProvider(...)`.
3. O núcleo expõe `api.runtime.imageGeneration.generate(...)` e `.listProviders(...)`.
4. Os plugins de fornecedores (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) registram implementações respaldadas por fornecedores.
5. Futuros fornecedores registram o mesmo contrato sem alterar canais/ferramentas.

A chave de configuração é intencionalmente separada do roteamento de análise visual:

- `agents.defaults.imageModel` analisa imagens.
- `agents.defaults.imageGenerationModel` gera imagens.

Mantenha-as separadas para que o fallback e a política permaneçam explícitos.

## Provedores de embeddings

Use `registerEmbeddingProvider(...)` / contrato `embeddingProviders` para
provedores reutilizáveis de embeddings vetoriais. Este contrato é intencionalmente mais amplo
que a memória: ferramentas, pesquisa, recuperação, importadores ou futuros plugins de recursos
podem consumir embeddings sem depender do mecanismo de memória. A pesquisa na memória
também consome `embeddingProviders` genéricos.

A API de registro mais antiga, específica para memória, e o contrato `memoryEmbeddingProviders`
estão obsoletos. Use `registerEmbeddingProvider` e
`embeddingProviders` para todos os novos provedores de embeddings.

## Lista de verificação para revisão

Antes de disponibilizar uma nova capacidade, verifique:

- Nenhum canal/ferramenta importa diretamente o código do fornecedor.
- O auxiliar de runtime é o caminho compartilhado.
- Pelo menos um teste de contrato confirma a propriedade incluída.
- A documentação de configuração menciona o novo modelo/chave de configuração.
- A documentação de plugins explica o limite de propriedade.

Se um PR ignorar a camada de capacidade e codificar diretamente o comportamento do fornecedor em um canal/ferramenta, devolva-o e primeiro defina o contrato.

## Conteúdo relacionado

- [Aspectos internos dos plugins](/pt-BR/plugins/architecture) — modelo de capacidades, propriedade, pipeline de carregamento e auxiliares de runtime.
- [Desenvolvimento de plugins](/pt-BR/plugins/building-plugins) — tutorial do primeiro plugin.
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — mapa de importações e referência da API de registro.
- [Criação de skills](/pt-BR/tools/creating-skills) — superfície complementar para colaboradores.
