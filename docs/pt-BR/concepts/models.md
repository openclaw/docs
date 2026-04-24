---
read_when:
    - Adicionando ou modificando a CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Alterando o comportamento de fallback de modelo ou a UX de seleção
    - Atualizando sondagens de varredura de modelo (ferramentas/imagens)
summary: 'CLI de modelos: listar, definir, aliases, fallbacks, varredura, status'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-24T05:48:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

Consulte [/concepts/model-failover](/pt-BR/concepts/model-failover) para rotação de
perfis de autenticação, períodos de espera e como isso interage com fallbacks.
Visão geral rápida de provedores + exemplos: [/concepts/model-providers](/pt-BR/concepts/model-providers).

## Como a seleção de modelo funciona

O OpenClaw seleciona modelos nesta ordem:

1. Modelo **primário** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** em `agents.defaults.model.fallbacks` (em ordem).
3. O **failover de autenticação do provedor** acontece dentro de um provedor antes de passar para o
   próximo modelo.

Relacionado:

- `agents.defaults.models` é a allowlist/catálogo de modelos que o OpenClaw pode usar (mais aliases).
- `agents.defaults.imageModel` é usado **somente quando** o modelo primário não pode aceitar imagens.
- `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta
  recorre a `agents.defaults.imageModel`, depois ao modelo resolvido da sessão/padrão.
- `agents.defaults.imageGenerationModel` é usado pela capacidade compartilhada de geração de imagem. Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de imagem na ordem do ID do provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
- `agents.defaults.musicGenerationModel` é usado pela capacidade compartilhada de geração de música. Se omitido, `music_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de música na ordem do ID do provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
- `agents.defaults.videoGenerationModel` é usado pela capacidade compartilhada de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de vídeo na ordem do ID do provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
- Padrões por agente podem substituir `agents.defaults.model` via `agents.list[].model` mais bindings (consulte [/concepts/multi-agent](/pt-BR/concepts/multi-agent)).

## Política rápida de modelo

- Defina o primário como o modelo de geração mais recente e mais forte disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e para chats de menor criticidade.
- Para agentes com ferramentas ativadas ou entradas não confiáveis, evite níveis de modelo mais antigos/mais fracos.

## Onboarding (recomendado)

Se você não quiser editar a configuração manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para provedores comuns, incluindo **assinatura do
OpenAI Code (Codex)** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de configuração (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + parâmetros de provedor)
- `models.providers` (provedores personalizados gravados em `models.json`)

Referências de modelo são normalizadas para minúsculas. Aliases de provedor como `z.ai/*` são normalizados
para `zai/*`.

Exemplos de configuração de provedor (incluindo OpenCode) estão em
[/providers/opencode](/pt-BR/providers/opencode).

### Edições seguras da allowlist

Use gravações aditivas ao atualizar `agents.defaults.models` manualmente:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protege mapas de modelo/provedor contra sobrescritas acidentais. Uma
atribuição simples de objeto para `agents.defaults.models`, `models.providers` ou
`models.providers.<id>.models` é rejeitada quando removeria entradas
existentes. Use `--merge` para alterações aditivas; use `--replace` apenas quando o
valor fornecido deve se tornar o valor-alvo completo.

A configuração interativa de provedor e `openclaw configure --section model` também fazem merge
de seleções com escopo de provedor na allowlist existente, de modo que adicionar Codex,
Ollama ou outro provedor não elimina entradas de modelo não relacionadas.

## "Model is not allowed" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** de `/model` e de
substituições de sessão. Quando um usuário seleciona um modelo que não está nessa allowlist,
o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode parecer
que “não respondeu”. A correção é:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a allowlist (remover `agents.defaults.models`), ou
- Escolher um modelo de `/model list`.

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

## Trocando modelos no chat (`/model`)

Você pode trocar modelos para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Observações:

- `/model` (e `/model list`) é um seletor compacto e numerado (família de modelos + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo, além de uma etapa Submit.
- `/models add` está disponível por padrão e pode ser desativado com `commands.modelsWrite=false`.
- Quando ativado, `/models add <provider> <modelId>` é o caminho mais rápido; `/models add` sem argumentos inicia um fluxo guiado com provedor primeiro, quando compatível.
- Após `/models add`, o novo modelo fica disponível em `/models` e `/model` sem reiniciar o gateway.
- `/model <#>` seleciona a partir desse seletor.
- `/model` persiste imediatamente a nova seleção da sessão.
- Se o agente estiver ocioso, a próxima execução usa o novo modelo imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de nova tentativa.
- Se a atividade de ferramentas ou a saída de resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de nova tentativa ou até o próximo turno do usuário.
- `/model status` é a visualização detalhada (candidatos de autenticação e, quando configurado, `baseUrl` + modo `api` do endpoint do provedor).
- Referências de modelo são analisadas dividindo na **primeira** `/`. Use `provider/model` ao digitar `/model <ref>`.
- Se o próprio ID do modelo contiver `/` (estilo OpenRouter), você deve incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw resolve a entrada nesta ordem:
  1. correspondência de alias
  2. correspondência única de provedor configurado para esse ID exato de modelo sem prefixo
  3. fallback obsoleto para o provedor padrão configurado
     Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw
     recorre ao primeiro provedor/modelo configurado para evitar
     expor um padrão obsoleto de provedor removido.

Comportamento/configuração completa do comando: [Comandos com barra](/pt-BR/tools/slash-commands).

Exemplos:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## Comandos CLI

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

- `--all`: catálogo completo
- `--local`: somente provedores locais
- `--provider <id>`: filtrar por ID do provedor, por exemplo `moonshot`; rótulos de exibição
  de seletores interativos não são aceitos
- `--plain`: um modelo por linha
- `--json`: saída legível por máquina

`--all` inclui linhas estáticas de catálogo pertencentes ao provedor incluído antes que a autenticação seja
configurada, então visualizações apenas de descoberta podem mostrar modelos que ficam indisponíveis até
você adicionar credenciais de provedor correspondentes.

### `models status`

Mostra o modelo primário resolvido, fallbacks, modelo de imagem e uma visão geral de autenticação
dos provedores configurados. Também exibe o status de expiração de OAuth para perfis encontrados
no auth store (avisa dentro de 24h por padrão). `--plain` imprime apenas o
modelo primário resolvido.
O status de OAuth é sempre mostrado (e incluído na saída `--json`). Se um provedor
configurado não tiver credenciais, `models status` imprime uma seção **Missing auth**.
O JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers`
(autenticação efetiva por provedor, incluindo credenciais vindas de env). `auth.oauth`
refere-se apenas à integridade dos perfis do auth-store; provedores apenas com env não aparecem ali.
Use `--check` para automação (saída `1` quando ausente/expirado, `2` quando expirando).
Use `--probe` para verificações de autenticação em tempo real; linhas de sondagem podem vir de perfis de autenticação, credenciais de env ou `models.json`.
Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem relata
`excluded_by_auth_order` em vez de tentar usá-lo. Se existir autenticação, mas nenhum modelo
sondável puder ser resolvido para esse provedor, a sondagem relata `status: no_model`.

A escolha da autenticação depende do provedor/conta. Para hosts de gateway sempre ativos, chaves de API
costumam ser as mais previsíveis; reutilização do Claude CLI e perfis existentes de OAuth/token da Anthropic
também são compatíveis.

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Varredura (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode
opcionalmente sondar modelos para suporte a ferramentas e imagens.

Principais flags:

- `--no-probe`: pular sondagens em tempo real (somente metadados)
- `--min-params <b>`: tamanho mínimo de parâmetros (bilhões)
- `--max-age-days <days>`: pular modelos mais antigos
- `--provider <name>`: filtro de prefixo do provedor
- `--max-candidates <n>`: tamanho da lista de fallback
- `--set-default`: define `agents.defaults.model.primary` para a primeira seleção
- `--set-image`: define `agents.defaults.imageModel.primary` para a primeira seleção de imagem

As sondagens exigem uma chave de API do OpenRouter (de perfis de autenticação ou
`OPENROUTER_API_KEY`). Sem uma chave, use `--no-probe` para listar apenas candidatos.

Os resultados da varredura são classificados por:

1. Suporte a imagem
2. Latência de ferramenta
3. Tamanho de contexto
4. Contagem de parâmetros

Entrada

- Lista `/models` do OpenRouter (filtro `:free`)
- Exige chave de API do OpenRouter de perfis de autenticação ou `OPENROUTER_API_KEY` (consulte [/environment](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de sondagem: `--timeout`, `--concurrency`

Quando executado em um TTY, você pode selecionar fallbacks interativamente. No modo não interativo,
passe `--yes` para aceitar os padrões.

## Registro de modelos (`models.json`)

Provedores personalizados em `models.providers` são gravados em `models.json` no
diretório do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo
é mesclado por padrão, a menos que `models.mode` esteja definido como `replace`.

Precedência do modo de merge para IDs de provedor correspondentes:

- `baseUrl` não vazio já presente em `models.json` do agente prevalece.
- `apiKey` não vazio em `models.json` do agente prevalece apenas quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
- Valores `apiKey` de provedores gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec) em vez de persistir segredos resolvidos.
- Valores de cabeçalho de provedores gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec).
- `apiKey`/`baseUrl` vazios ou ausentes no agente recorrem a `models.providers` da configuração.
- Outros campos do provedor são atualizados a partir da configuração e de dados normalizados do catálogo.

A persistência de marcadores é autoritativa da fonte: o OpenClaw grava marcadores a partir do snapshot ativo da configuração de origem (pré-resolução), não a partir de valores de segredo resolvidos em tempo de execução.
Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comando, como `openclaw agent`.

## Relacionado

- [Provedores de modelo](/pt-BR/concepts/model-providers) — roteamento e autenticação de provedores
- [Failover de modelo](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Geração de imagem](/pt-BR/tools/image-generation) — configuração de modelo de imagem
- [Geração de música](/pt-BR/tools/music-generation) — configuração de modelo de música
- [Geração de vídeo](/pt-BR/tools/video-generation) — configuração de modelo de vídeo
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelo
