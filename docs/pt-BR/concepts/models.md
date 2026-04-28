---
read_when:
    - Adicionando ou modificando a CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Mudando o comportamento de fallback de modelo ou a UX de seleção
    - Atualizando sondagens de varredura de modelos (ferramentas/imagens)
sidebarTitle: Models CLI
summary: 'CLI de modelos: listar, definir, aliases, fallbacks, varredura, status'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-26T11:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Failover de modelo" href="/pt-BR/concepts/model-failover">
    Rotação de perfil de autenticação, cooldowns e como isso interage com fallbacks.
  </Card>
  <Card title="Providers de modelo" href="/pt-BR/concepts/model-providers">
    Visão geral rápida de providers e exemplos.
  </Card>
  <Card title="Runtimes de agente" href="/pt-BR/concepts/agent-runtimes">
    PI, Codex e outros runtimes de loop de agente.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults">
    Chaves de configuração de modelo.
  </Card>
</CardGroup>

Refs de modelo escolhem um provider e um modelo. Normalmente, eles não escolhem o runtime de agente de baixo nível. Por exemplo, `openai/gpt-5.5` pode ser executado pelo caminho normal do provider OpenAI ou pelo runtime do servidor de app Codex, dependendo de `agents.defaults.agentRuntime.id`. Veja [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

## Como a seleção de modelo funciona

O OpenClaw seleciona modelos nesta ordem:

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (ou `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (em ordem).
  </Step>
  <Step title="Failover de autenticação do provider">
    O failover de autenticação acontece dentro de um provider antes de passar para o próximo modelo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Superfícies de modelo relacionadas">
    - `agents.defaults.models` é a allowlist/catálogo de modelos que o OpenClaw pode usar (mais aliases).
    - `agents.defaults.imageModel` é usado **somente quando** o modelo principal não pode aceitar imagens.
    - `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta faz fallback para `agents.defaults.imageModel` e depois para o modelo resolvido da sessão/padrão.
    - `agents.defaults.imageGenerationModel` é usado pela capacidade compartilhada de geração de imagens. Se omitido, `image_generate` ainda pode inferir um padrão de provider com autenticação. Ele tenta primeiro o provider padrão atual e depois os providers de geração de imagem registrados restantes em ordem de provider-id. Se você definir um provider/modelo específico, também configure a autenticação/chave de API desse provider.
    - `agents.defaults.musicGenerationModel` é usado pela capacidade compartilhada de geração de música. Se omitido, `music_generate` ainda pode inferir um padrão de provider com autenticação. Ele tenta primeiro o provider padrão atual e depois os providers de geração de música registrados restantes em ordem de provider-id. Se você definir um provider/modelo específico, também configure a autenticação/chave de API desse provider.
    - `agents.defaults.videoGenerationModel` é usado pela capacidade compartilhada de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um padrão de provider com autenticação. Ele tenta primeiro o provider padrão atual e depois os providers de geração de vídeo registrados restantes em ordem de provider-id. Se você definir um provider/modelo específico, também configure a autenticação/chave de API desse provider.
    - Padrões por agente podem substituir `agents.defaults.model` via `agents.list[].model` mais bindings (veja [Roteamento de vários agentes](/pt-BR/concepts/multi-agent)).
  </Accordion>
</AccordionGroup>

## Política rápida de modelo

- Defina o principal como o modelo mais forte e de geração mais recente disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e chats de menor importância.
- Para agentes com ferramentas ativadas ou entradas não confiáveis, evite camadas de modelos mais antigas/mais fracas.

## Onboarding (recomendado)

Se você não quiser editar a config manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para providers comuns, incluindo **assinatura OpenAI Code (Codex)** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de config (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + parâmetros de provider)
- `models.providers` (providers personalizados gravados em `models.json`)

<Note>
Refs de modelo são normalizadas para minúsculas. Aliases de provider como `z.ai/*` são normalizados para `zai/*`.

Exemplos de configuração de provider (incluindo OpenCode) estão em [OpenCode](/pt-BR/providers/opencode).
</Note>

### Edições seguras de allowlist

Use gravações aditivas ao atualizar `agents.defaults.models` manualmente:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regras de proteção contra sobrescrita">
    `openclaw config set` protege mapas de modelo/provider contra sobrescritas acidentais. Uma atribuição simples de objeto para `agents.defaults.models`, `models.providers` ou `models.providers.<id>.models` é rejeitada quando removeria entradas existentes. Use `--merge` para mudanças aditivas; use `--replace` apenas quando o valor fornecido deve se tornar o valor completo do alvo.

    A configuração interativa de provider e `openclaw configure --section model` também mesclam seleções com escopo de provider na allowlist existente, então adicionar Codex, Ollama ou outro provider não remove entradas de modelo não relacionadas. Configure preserva um `agents.defaults.model.primary` existente quando a autenticação do provider é reaplicada. Comandos explícitos de definição de padrão, como `openclaw models auth login --provider <id> --set-default` e `openclaw models set <model>`, ainda substituem `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Model is not allowed" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e para substituições de sessão. Quando um usuário seleciona um modelo que não está nessa allowlist, o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode parecer que "não respondeu". A correção é:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a allowlist (remover `agents.defaults.models`), ou
- Escolher um modelo em `/model list`.
</Warning>

Exemplo de config de allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Trocando modelos no chat (`/model`)

Você pode trocar modelos para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Comportamento do seletor">
    - `/model` (e `/model list`) é um seletor compacto numerado (família de modelo + providers disponíveis).
    - No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provider e modelo, além de uma etapa de envio.
    - `/models add` está obsoleto e agora retorna uma mensagem de obsolescência em vez de registrar modelos a partir do chat.
    - `/model <#>` seleciona a partir desse seletor.
  </Accordion>
  <Accordion title="Persistência e troca ao vivo">
    - `/model` persiste imediatamente a nova seleção da sessão.
    - Se o agente estiver ocioso, a próxima execução usa o novo modelo imediatamente.
    - Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de repetição.
    - Se a atividade de ferramenta ou a saída de resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de repetição ou o próximo turno do usuário.
    - `/model status` é a visualização detalhada (candidatos de autenticação e, quando configurado, `baseUrl` do endpoint do provider + modo `api`).
  </Accordion>
  <Accordion title="Análise de ref">
    - Refs de modelo são analisadas dividindo no **primeiro** `/`. Use `provider/model` ao digitar `/model <ref>`.
    - Se o próprio ID do modelo contiver `/` (estilo OpenRouter), você deve incluir o prefixo do provider (exemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Se você omitir o provider, o OpenClaw resolve a entrada nesta ordem:
      1. correspondência de alias
      2. correspondência única de provider configurado para esse id de modelo exato sem prefixo
      3. fallback obsoleto para o provider padrão configurado — se esse provider não expuser mais o modelo padrão configurado, o OpenClaw faz fallback para o primeiro provider/modelo configurado para evitar expor um padrão obsoleto de provider removido.
  </Accordion>
</AccordionGroup>

Comportamento/configuração completos do comando: [Comandos slash](/pt-BR/tools/slash-commands).

## Comandos da CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (sem subcomando) é um atalho para `models status`.

### `models list`

Mostra modelos configurados por padrão. Flags úteis:

<ParamField path="--all" type="boolean">
  Catálogo completo. Inclui linhas estáticas de catálogo de providers incluídos no pacote antes que a autenticação seja configurada, então visualizações apenas de descoberta podem mostrar modelos indisponíveis até que você adicione credenciais correspondentes do provider.
</ParamField>
<ParamField path="--local" type="boolean">
  Apenas providers locais.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra por id do provider, por exemplo `moonshot`. Rótulos de exibição de seletores interativos não são aceitos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Um modelo por linha.
</ParamField>
<ParamField path="--json" type="boolean">
  Saída legível por máquina.
</ParamField>

### `models status`

Mostra o modelo principal resolvido, fallbacks, modelo de imagem e uma visão geral de autenticação dos providers configurados. Também mostra o status de expiração de OAuth para perfis encontrados no armazenamento de autenticação (avisa dentro de 24h por padrão). `--plain` imprime apenas o modelo principal resolvido.

<AccordionGroup>
  <Accordion title="Comportamento de autenticação e sondagem">
    - O status de OAuth é sempre exibido (e incluído na saída `--json`). Se um provider configurado não tiver credenciais, `models status` imprime uma seção **Missing auth**.
    - O JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers` (autenticação efetiva por provider, incluindo credenciais baseadas em env). `auth.oauth` mostra apenas a integridade de perfis do armazenamento de autenticação; providers somente por env não aparecem ali.
    - Use `--check` para automação (saída `1` quando ausente/expirado, `2` quando prestes a expirar).
    - Use `--probe` para verificações de autenticação ao vivo; linhas de sondagem podem vir de perfis de autenticação, credenciais de env ou `models.json`.
    - Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem relata `excluded_by_auth_order` em vez de tentá-lo. Se a autenticação existir, mas nenhum modelo sondável puder ser resolvido para esse provider, a sondagem relata `status: no_model`.
  </Accordion>
</AccordionGroup>

<Note>
A escolha de autenticação depende de provider/conta. Para hosts de Gateway sempre ativos, chaves de API costumam ser a opção mais previsível; reutilização do Claude CLI e perfis existentes de OAuth/token da Anthropic também são compatíveis.
</Note>

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Varredura (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode opcionalmente sondar modelos para suporte a ferramentas e imagens.

<ParamField path="--no-probe" type="boolean">
  Pula sondagens ao vivo (apenas metadados).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Tamanho mínimo de parâmetros (bilhões).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Pula modelos mais antigos.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtro de prefixo do provider.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Tamanho da lista de fallback.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Define `agents.defaults.model.primary` como a primeira seleção.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Define `agents.defaults.imageModel.primary` como a primeira seleção de imagem.
</ParamField>

<Note>
O catálogo OpenRouter `/models` é público, então varreduras apenas de metadados podem listar candidatos gratuitos sem chave. Sondagem e inferência ainda exigem uma chave de API do OpenRouter (de perfis de autenticação ou `OPENROUTER_API_KEY`). Se nenhuma chave estiver disponível, `openclaw models scan` faz fallback para saída apenas de metadados e deixa a config inalterada. Use `--no-probe` para solicitar explicitamente o modo apenas de metadados.
</Note>

Os resultados da varredura são classificados por:

1. Suporte a imagem
2. Latência de ferramenta
3. Tamanho de contexto
4. Contagem de parâmetros

Entrada:

- Lista OpenRouter `/models` (filtro `:free`)
- Sondagens ao vivo exigem chave de API do OpenRouter de perfis de autenticação ou `OPENROUTER_API_KEY` (veja [Variáveis de ambiente](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitação/sondagem: `--timeout`, `--concurrency`

Quando sondagens ao vivo são executadas em um TTY, você pode selecionar fallbacks interativamente. No modo não interativo, passe `--yes` para aceitar os padrões. Resultados apenas de metadados são informativos; `--set-default` e `--set-image` exigem sondagens ao vivo para que o OpenClaw não configure um modelo OpenRouter sem chave e inutilizável.

## Registro de modelos (`models.json`)

Providers personalizados em `models.providers` são gravados em `models.json` no diretório do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo é mesclado por padrão, a menos que `models.mode` esteja definido como `replace`.

<AccordionGroup>
  <Accordion title="Precedência do modo de mesclagem">
    Precedência do modo de mesclagem para IDs de provider correspondentes:

    - `baseUrl` não vazio já presente no `models.json` do agente tem prioridade.
    - `apiKey` não vazio no `models.json` do agente tem prioridade apenas quando esse provider não é gerenciado por SecretRef no contexto atual de config/perfil de autenticação.
    - Valores de `apiKey` de provider gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec) em vez de persistir segredos resolvidos.
    - Valores de header de provider gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec).
    - `apiKey`/`baseUrl` vazios ou ausentes no agente fazem fallback para `models.providers` da config.
    - Outros campos de provider são atualizados a partir da config e de dados de catálogo normalizados.

  </Accordion>
</AccordionGroup>

<Note>
A persistência de marcadores é autoritativa da origem: o OpenClaw grava marcadores a partir do snapshot ativo da config de origem (pré-resolução), não a partir de valores de segredo resolvidos em runtime. Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comando como `openclaw agent`.
</Note>

## Relacionado

- [Runtimes de agente](/pt-BR/concepts/agent-runtimes) — PI, Codex e outros runtimes de loop de agente
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — chaves de config de modelo
- [Geração de imagens](/pt-BR/tools/image-generation) — configuração de modelo de imagem
- [Failover de modelo](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Providers de modelo](/pt-BR/concepts/model-providers) — roteamento e autenticação de providers
- [Geração de música](/pt-BR/tools/music-generation) — configuração de modelo de música
- [Geração de vídeo](/pt-BR/tools/video-generation) — configuração de modelo de vídeo
