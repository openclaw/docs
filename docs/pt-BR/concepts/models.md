---
read_when:
    - Adicionar ou modificar a CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Alteração do comportamento de fallback do modelo ou da UX de seleção
    - Atualizando sondas de varredura de modelos (ferramentas/imagens)
sidebarTitle: Models CLI
summary: 'CLI de modelos: listar, definir, aliases, fallbacks, verificar, status'
title: CLI de modelos
x-i18n:
    generated_at: "2026-05-02T20:45:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover de modelos" href="/pt-BR/concepts/model-failover">
    Rotação de perfis de autenticação, cooldowns e como isso interage com fallbacks.
  </Card>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers">
    Visão geral rápida de provedores e exemplos.
  </Card>
  <Card title="Runtimes de agentes" href="/pt-BR/concepts/agent-runtimes">
    PI, Codex e outros runtimes de loop de agente.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults">
    Chaves de configuração de modelo.
  </Card>
</CardGroup>

Refs de modelo escolhem um provedor e um modelo. Normalmente, elas não escolhem o runtime de agente de baixo nível. Por exemplo, `openai/gpt-5.5` pode ser executado pelo caminho normal do provedor OpenAI ou pelo runtime do servidor de app do Codex, dependendo de `agents.defaults.agentRuntime.id`. No modo de runtime do Codex, a ref `openai/gpt-*` não implica cobrança por chave de API; a autenticação pode vir de uma conta Codex ou do perfil de autenticação `openai-codex`. Consulte [Runtimes de agentes](/pt-BR/concepts/agent-runtimes).

## Como a seleção de modelo funciona

OpenClaw seleciona modelos nesta ordem:

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (ou `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (em ordem).
  </Step>
  <Step title="Failover de autenticação do provedor">
    O failover de autenticação acontece dentro de um provedor antes de passar para o próximo modelo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Superfícies de modelo relacionadas">
    - `agents.defaults.models` é a allowlist/catálogo de modelos que o OpenClaw pode usar (além de aliases).
    - `agents.defaults.imageModel` é usado **somente quando** o modelo principal não consegue aceitar imagens.
    - `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta faz fallback para `agents.defaults.imageModel` e depois para o modelo resolvido da sessão/padrão.
    - `agents.defaults.imageGenerationModel` é usado pela capacidade compartilhada de geração de imagens. Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os provedores de geração de imagens registrados restantes em ordem de ID de provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
    - `agents.defaults.musicGenerationModel` é usado pela capacidade compartilhada de geração de música. Se omitido, `music_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os provedores de geração de música registrados restantes em ordem de ID de provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
    - `agents.defaults.videoGenerationModel` é usado pela capacidade compartilhada de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os provedores de geração de vídeo registrados restantes em ordem de ID de provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
    - Padrões por agente podem substituir `agents.defaults.model` via `agents.list[].model` mais associações (consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Origem da seleção e comportamento de fallback

O mesmo `provider/model` pode significar coisas diferentes dependendo de onde veio:

- Padrões configurados (`agents.defaults.model.primary` e modelos principais específicos do agente) são o ponto de partida normal e usam `agents.defaults.model.fallbacks`.
- Seleções automáticas de fallback são estado temporário de recuperação. Elas são armazenadas com `modelOverrideSource: "auto"` para que turnos posteriores possam continuar usando a cadeia de fallback sem sondar primeiro um modelo principal sabidamente ruim.
- Seleções de sessão do usuário são exatas. `/model`, o seletor de modelos, `session_status(model=...)` e `sessions.patch` armazenam `modelOverrideSource: "user"`; se esse provedor/modelo selecionado estiver inacessível, o OpenClaw falha de forma visível em vez de passar para outro modelo configurado.
- `--model` de Cron / `model` do payload é um modelo principal por job. Ele ainda usa fallbacks configurados, a menos que o job forneça `fallbacks` explícitos no payload (use `fallbacks: []` para uma execução de cron estrita).
- Seletores de modelo padrão e de allowlist da CLI respeitam `models.mode: "replace"` listando `models.providers.*.models` explícitos em vez de carregar todo o catálogo integrado completo.
- O seletor de modelos da UI de Controle pede ao Gateway sua visão de modelos configurada: `agents.defaults.models` quando presente; caso contrário, `models.providers.*.models` explícitos mais provedores com autenticação utilizável. O catálogo integrado completo fica reservado para visualizações explícitas de navegação, como `models.list` com `view: "all"` ou `openclaw models list --all`.

## Política rápida de modelos

- Defina seu principal como o modelo de geração mais recente e mais forte disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e chat de menor risco.
- Para agentes com ferramentas habilitadas ou entradas não confiáveis, evite camadas de modelos mais antigas/mais fracas.

## Onboarding (recomendado)

Se você não quiser editar a configuração manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para provedores comuns, incluindo **assinatura OpenAI Code (Codex)** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de configuração (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + parâmetros de provedor)
- `models.providers` (provedores personalizados gravados em `models.json`)

<Note>
Refs de modelo são normalizadas para minúsculas. Aliases de provedor como `z.ai/*` são normalizados para `zai/*`.

Exemplos de configuração de provedor (incluindo OpenCode) ficam em [OpenCode](/pt-BR/providers/opencode).
</Note>

### Edições seguras da allowlist

Use gravações aditivas ao atualizar `agents.defaults.models` manualmente:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regras de proteção contra sobrescrita">
    `openclaw config set` protege mapas de modelo/provedor contra sobrescritas acidentais. Uma atribuição de objeto simples a `agents.defaults.models`, `models.providers` ou `models.providers.<id>.models` é rejeitada quando removeria entradas existentes. Use `--merge` para alterações aditivas; use `--replace` somente quando o valor fornecido deve se tornar o valor alvo completo.

    A configuração interativa de provedor e `openclaw configure --section model` também mesclam seleções com escopo de provedor na allowlist existente, então adicionar Codex, Ollama ou outro provedor não remove entradas de modelo não relacionadas. Configure preserva um `agents.defaults.model.primary` existente quando a autenticação do provedor é reaplicada. Comandos explícitos de definição de padrão, como `openclaw models auth login --provider <id> --set-default` e `openclaw models set <model>`, ainda substituem `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Modelo não é permitido" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e para substituições de sessão. Quando um usuário seleciona um modelo que não está nessa allowlist, o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Isso acontece **antes** que uma resposta normal seja gerada, então a mensagem pode parecer que "não respondeu". A correção é:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a allowlist (remover `agents.defaults.models`), ou
- Escolher um modelo em `/model list`.

</Warning>

Para modelos locais/GGUF, armazene a ref completa com prefixo do provedor na allowlist,
por exemplo `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` ou o
`provider/model` exato mostrado por `openclaw models list --provider <provider>`.
Nomes de arquivos locais simples ou nomes de exibição não são suficientes quando a allowlist está
ativa.

Exemplo de configuração de allowlist:

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

## Alternando modelos no chat (`/model`)

Você pode alternar modelos para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Comportamento do seletor">
    - `/model` (e `/model list`) é um seletor compacto e numerado (família de modelo + provedores disponíveis).
    - No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo, além de uma etapa Submit.
    - No Telegram, as seleções do seletor `/models` têm escopo de sessão; elas não alteram o padrão persistente do agente em `openclaw.json`.
    - `/models add` está obsoleto e agora retorna uma mensagem de obsolescência em vez de registrar modelos pelo chat.
    - `/model <#>` seleciona a partir desse seletor.

  </Accordion>
  <Accordion title="Persistência e alternância ao vivo">
    - `/model` persiste imediatamente a nova seleção de sessão.
    - Se o agente estiver ocioso, a próxima execução usa o novo modelo imediatamente.
    - Se uma execução já estiver ativa, o OpenClaw marca uma alternância ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de nova tentativa.
    - Se a atividade de ferramenta ou a saída da resposta já tiver começado, a alternância pendente pode ficar na fila até uma oportunidade posterior de nova tentativa ou o próximo turno do usuário.
    - Uma ref `/model` selecionada pelo usuário é estrita para essa sessão: se o provedor/modelo selecionado estiver inacessível, a resposta falha de forma visível em vez de responder silenciosamente a partir de `agents.defaults.model.fallbacks`. Isso é diferente de padrões configurados e modelos principais de jobs cron, que ainda podem usar cadeias de fallback.
    - `/model status` é a visualização detalhada (candidatos de autenticação e, quando configurado, `baseUrl` do endpoint do provedor + modo `api`).

  </Accordion>
  <Accordion title="Análise de refs">
    - Refs de modelo são analisadas dividindo na **primeira** `/`. Use `provider/model` ao digitar `/model <ref>`.
    - Se o próprio ID do modelo contiver `/` (estilo OpenRouter), você deve incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Se você omitir o provedor, o OpenClaw resolve a entrada nesta ordem:
      1. correspondência de alias
      2. correspondência única de provedor configurado para esse ID de modelo exato sem prefixo
      3. fallback obsoleto para o provedor padrão configurado — se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw, em vez disso, faz fallback para o primeiro provedor/modelo configurado para evitar exibir um padrão obsoleto de provedor removido.
  </Accordion>
</AccordionGroup>

Comportamento/configuração completa dos comandos: [Comandos de barra](/pt-BR/tools/slash-commands).

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

Mostra modelos configurados/disponíveis por autenticação por padrão. Flags úteis:

<ParamField path="--all" type="boolean">
  Catálogo completo. Inclui linhas de catálogo estático agrupadas e pertencentes ao provedor antes da configuração da autenticação, para que visualizações apenas de descoberta possam mostrar modelos que ficam indisponíveis até você adicionar credenciais correspondentes do provedor.
</ParamField>
<ParamField path="--local" type="boolean">
  Apenas provedores locais.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtre por id do provedor, por exemplo `moonshot`. Rótulos exibidos por seletores interativos não são aceitos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Um modelo por linha.
</ParamField>
<ParamField path="--json" type="boolean">
  Saída legível por máquina.
</ParamField>

### `models status`

Mostra o modelo primário resolvido, fallbacks, modelo de imagem e uma visão geral de autenticação dos provedores configurados. Também exibe o status de expiração OAuth para perfis encontrados no armazenamento de autenticação (avisa com 24h de antecedência por padrão). `--plain` imprime apenas o modelo primário resolvido.

<AccordionGroup>
  <Accordion title="Comportamento de autenticação e sondagem">
    - O status OAuth é sempre mostrado (e incluído na saída `--json`). Se um provedor configurado não tiver credenciais, `models status` imprime uma seção **Autenticação ausente**.
    - JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers` (autenticação efetiva por provedor, incluindo credenciais baseadas em env). `auth.oauth` é apenas a integridade de perfis do armazenamento de autenticação; provedores somente por env não aparecem ali.
    - Use `--check` para automação (sai com `1` quando ausente/expirado, `2` quando expirando).
    - Use `--probe` para verificações de autenticação ao vivo; linhas de sondagem podem vir de perfis de autenticação, credenciais de env ou `models.json`.
    - Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem relata `excluded_by_auth_order` em vez de tentar usá-lo. Se houver autenticação, mas nenhum modelo sondável puder ser resolvido para esse provedor, a sondagem relata `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
A escolha de autenticação depende do provedor/conta. Para hosts de gateway sempre ativos, chaves de API geralmente são as mais previsíveis; a reutilização do Claude CLI e perfis OAuth/token existentes da Anthropic também são compatíveis.
</Note>

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Varredura (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode, opcionalmente, sondar modelos para suporte a ferramentas e imagens.

<ParamField path="--no-probe" type="boolean">
  Pule sondagens ao vivo (somente metadados).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Tamanho mínimo de parâmetros (bilhões).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Pule modelos mais antigos.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtro por prefixo do provedor.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Tamanho da lista de fallback.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Defina `agents.defaults.model.primary` como a primeira seleção.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Defina `agents.defaults.imageModel.primary` como a primeira seleção de imagem.
</ParamField>

<Note>
O catálogo `/models` do OpenRouter é público, então varreduras somente de metadados podem listar candidatos gratuitos sem uma chave. Sondagem e inferência ainda exigem uma chave de API do OpenRouter (de perfis de autenticação ou `OPENROUTER_API_KEY`). Se nenhuma chave estiver disponível, `openclaw models scan` recorre à saída somente de metadados e deixa a configuração inalterada. Use `--no-probe` para solicitar explicitamente o modo somente de metadados.
</Note>

Os resultados da varredura são classificados por:

1. Suporte a imagens
2. Latência de ferramentas
3. Tamanho de contexto
4. Contagem de parâmetros

Entrada:

- Lista `/models` do OpenRouter (filtro `:free`)
- Sondagens ao vivo exigem chave de API do OpenRouter de perfis de autenticação ou `OPENROUTER_API_KEY` (consulte [Variáveis de ambiente](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitação/sondagem: `--timeout`, `--concurrency`

Quando sondagens ao vivo são executadas em um TTY, você pode selecionar fallbacks interativamente. No modo não interativo, passe `--yes` para aceitar os padrões. Resultados somente de metadados são informativos; `--set-default` e `--set-image` exigem sondagens ao vivo para que o OpenClaw não configure um modelo OpenRouter sem chave e inutilizável.

## Registro de modelos (`models.json`)

Provedores personalizados em `models.providers` são gravados em `models.json` no diretório do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo é mesclado por padrão, a menos que `models.mode` esteja definido como `replace`.

<AccordionGroup>
  <Accordion title="Precedência do modo de mesclagem">
    Precedência do modo de mesclagem para IDs de provedores correspondentes:

    - `baseUrl` não vazio já presente no `models.json` do agente vence.
    - `apiKey` não vazio no `models.json` do agente vence apenas quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
    - Valores `apiKey` de provedores gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para referências de env, `secretref-managed` para referências de arquivo/exec) em vez de persistir segredos resolvidos.
    - Valores de cabeçalho de provedores gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para referências de env, `secretref-managed` para referências de arquivo/exec).
    - `apiKey`/`baseUrl` vazios ou ausentes do agente recorrem a `models.providers` da configuração.
    - Outros campos do provedor são atualizados a partir da configuração e de dados de catálogo normalizados.

  </Accordion>
</AccordionGroup>

<Note>
A persistência de marcadores tem a origem como autoridade: o OpenClaw grava marcadores do snapshot da configuração de origem ativa (antes da resolução), não dos valores de segredo resolvidos em runtime. Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comandos como `openclaw agent`.
</Note>

## Relacionado

- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes) — PI, Codex e outros runtimes de loop de agentes
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelos
- [Geração de imagens](/pt-BR/tools/image-generation) — configuração de modelo de imagem
- [Failover de modelo](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Provedores de modelos](/pt-BR/concepts/model-providers) — roteamento e autenticação de provedores
- [Geração de música](/pt-BR/tools/music-generation) — configuração de modelo de música
- [Geração de vídeo](/pt-BR/tools/video-generation) — configuração de modelo de vídeo
