---
read_when:
    - Depuração de autenticação de modelo ou expiração de OAuth
    - Documentando autenticação ou armazenamento de credenciais
summary: 'Autenticação de modelo: OAuth, chaves de API, reutilização da Claude CLI e setup-token da Anthropic'
title: Autenticação
x-i18n:
    generated_at: "2026-06-27T17:28:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Esta página é a referência de autenticação de **provedor de modelo** (chaves de API, OAuth, reutilização da Claude CLI e setup-token da Anthropic). Para autenticação de **conexão do Gateway** (token, senha, trusted-proxy), consulte [Configuração](/pt-BR/gateway/configuration) e [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
</Note>

OpenClaw oferece suporte a OAuth e chaves de API para provedores de modelos. Para hosts de Gateway sempre ativos, chaves de API geralmente são a opção mais previsível. Fluxos de assinatura/OAuth também são compatíveis quando correspondem ao modelo de conta do seu provedor.

Consulte [/concepts/oauth](/pt-BR/concepts/oauth) para ver o fluxo OAuth completo e o layout de armazenamento.
Para autenticação baseada em SecretRef (provedores `env`/`file`/`exec`), consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).
Para regras de elegibilidade de credenciais/códigos de motivo usadas por `models status --probe`, consulte [Semântica de credenciais de autenticação](/pt-BR/auth-credential-semantics).

## Configuração recomendada (chave de API, qualquer provedor)

Se você estiver executando um Gateway de longa duração, comece com uma chave de API para o provedor escolhido.
Especificamente para Anthropic, autenticação por chave de API ainda é a configuração de servidor mais previsível, mas OpenClaw também oferece suporte à reutilização de um login local da Claude CLI.

1. Crie uma chave de API no console do seu provedor.
2. Coloque-a no **host do Gateway** (a máquina que executa `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se o Gateway for executado sob systemd/launchd, prefira colocar a chave em
   `~/.openclaw/.env` para que o daemon consiga lê-la:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Depois reinicie o daemon (ou reinicie seu processo do Gateway) e verifique novamente:

```bash
openclaw models status
openclaw doctor
```

Se você preferir não gerenciar variáveis de ambiente manualmente, o onboarding pode armazenar chaves de API para uso pelo daemon: `openclaw onboard`.

Consulte [Ajuda](/pt-BR/help) para detalhes sobre herança de ambiente (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilidade com Claude CLI e token

A autenticação por setup-token da Anthropic ainda está disponível no OpenClaw como um caminho de token compatível. Desde então, a equipe da Anthropic nos informou que o uso da Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic publique uma nova política. Quando a reutilização da Claude CLI estiver disponível no host, esse agora é o caminho preferencial.

Para hosts de Gateway de longa duração, uma chave de API da Anthropic ainda é a configuração mais previsível. Se você quiser reutilizar um login Claude existente no mesmo host, use o caminho da Anthropic Claude CLI no onboarding/configure.

Configuração recomendada do host para reutilização da Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esta é uma configuração em duas etapas:

1. Faça login do próprio Claude Code na Anthropic no host do Gateway.
2. Informe ao OpenClaw para trocar a seleção de modelos da Anthropic para o backend local `claude-cli` e armazenar o perfil de autenticação correspondente do OpenClaw.

Se `claude` não estiver em `PATH`, instale o Claude Code primeiro ou defina `agents.defaults.cliBackends.claude-cli.command` como o caminho real do binário.

Entrada manual de token (qualquer provedor; grava o armazenamento de autenticação SQLite por agente + atualiza a configuração):

```bash
openclaw models auth paste-token --provider openrouter
```

O armazenamento de perfis de autenticação mantém apenas credenciais. Arquivos legados `auth-profiles.json` usavam este formato canônico:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw agora lê perfis de autenticação do `openclaw-agent.sqlite` de cada agente. Se uma instalação antiga ainda tiver `auth-profiles.json`, `auth-state.json` ou um arquivo plano de perfil de autenticação como `{ "openrouter": { "apiKey": "..." } }`, execute `openclaw doctor --fix` para importá-lo para o SQLite; o doctor mantém backups com timestamp ao lado dos arquivos JSON originais. Detalhes de endpoint como `baseUrl`, `api`, ids de modelo, cabeçalhos e timeouts pertencem a `models.providers.<id>` em `openclaw.json` ou `models.json`, não a perfis de autenticação.

Rotas de autenticação externas, como Bedrock `auth: "aws-sdk"`, também não são credenciais. Se você quiser uma rota Bedrock nomeada, coloque `auth.profiles.<id>.mode: "aws-sdk"` em `openclaw.json`; não grave `type: "aws-sdk"` no armazenamento de perfis de autenticação. `openclaw doctor --fix` move marcadores legados do AWS SDK do armazenamento de credenciais para metadados de configuração.

Referências de perfil de autenticação também são compatíveis com credenciais estáticas:

- Credenciais `api_key` podem usar `keyRef: { source, provider, id }`
- Credenciais `token` podem usar `tokenRef: { source, provider, id }`
- Perfis em modo OAuth não oferecem suporte a credenciais SecretRef; se `auth.profiles.<id>.mode` estiver definido como `"oauth"`, a entrada `keyRef`/`tokenRef` apoiada por SecretRef para esse perfil será rejeitada.

Verificação adequada para automação (saída `1` quando expirado/ausente, `2` quando prestes a expirar):

```bash
openclaw models status --check
```

Sondagens de autenticação ao vivo:

```bash
openclaw models status --probe
```

Notas:

- Linhas de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
- Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem relata `excluded_by_auth_order` para esse perfil em vez de tentar usá-lo.
- Se a autenticação existir, mas o OpenClaw não conseguir resolver um candidato de modelo sondável para esse provedor, a sondagem relata `status: no_model`.
- Cooldowns de limite de taxa podem ter escopo de modelo. Um perfil em cooldown para um modelo ainda pode ser utilizável para um modelo irmão no mesmo provedor.

Scripts operacionais opcionais (systemd/Termux) estão documentados aqui:
[Scripts de monitoramento de autenticação](/pt-BR/help/scripts#auth-monitoring-scripts)

## Observação sobre Anthropic

O backend `claude-cli` da Anthropic voltou a ser compatível.

- A equipe da Anthropic nos informou que este caminho de integração do OpenClaw voltou a ser permitido.
- Portanto, o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como sancionados para execuções apoiadas pela Anthropic, a menos que a Anthropic publique uma nova política.
- Chaves de API da Anthropic continuam sendo a escolha mais previsível para hosts de Gateway de longa duração e controle explícito de cobrança no lado do servidor.

## Verificando o status de autenticação de modelos

```bash
openclaw models status
openclaw doctor
```

## Comportamento de rotação de chaves de API (Gateway)

Alguns provedores oferecem suporte a tentar novamente uma solicitação com chaves alternativas quando uma chamada de API atinge um limite de taxa do provedor.

- Ordem de prioridade:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição única)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Provedores Google também incluem `GOOGLE_API_KEY` como fallback adicional.
- A mesma lista de chaves é desduplicada antes do uso.
- OpenClaw tenta novamente com a próxima chave apenas para erros de limite de taxa (por exemplo, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` ou `workers_ai ... quota limit exceeded`).
- Erros que não são de limite de taxa não são tentados novamente com chaves alternativas.
- Se todas as chaves falharem, o erro final da última tentativa será retornado.

## Removendo autenticação de provedor enquanto o Gateway está em execução

Quando a autenticação de provedor é removida pelo plano de controle do Gateway, o OpenClaw exclui os perfis de autenticação salvos para esse provedor e aborta chats ativos ou execuções de agente cujo provedor de modelo selecionado corresponde ao provedor removido. As execuções abortadas emitem os eventos normais de cancelamento de chat e ciclo de vida com `stopReason: "auth-revoked"`, para que clientes conectados possam mostrar que a execução foi interrompida porque as credenciais foram removidas.

Remover a autenticação salva não revoga chaves no provedor. Rotacione ou revogue a chave no painel do provedor quando precisar de invalidação no lado do provedor.

## Controlando qual credencial é usada

### OpenAI e ids legados `openai-codex`

Perfis de chave de API da OpenAI e perfis OAuth do ChatGPT/Codex usam o id canônico de provedor `openai`. Novas configurações devem usar ids de perfil `openai:*` e `auth.order.openai`.

Se você vir `openai-codex` em configurações antigas, ids de perfil de autenticação ou `auth.order.openai-codex`, trate isso como entrada de migração legada. Não crie novos perfis `openai-codex`. Execute:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

O doctor reescreve ids de perfil legados `openai-codex:*` e entradas `auth.order.openai-codex` para a rota de autenticação canônica `openai`. Para roteamento de modelo/runtime específico da OpenAI, consulte [OpenAI](/pt-BR/providers/openai).

### Durante o login (CLI)

Use `openclaw models auth login --provider <id> --profile-id <profileId>` para provedores que oferecem suporte a perfis de autenticação nomeados durante o login.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Esta é a maneira mais fácil de manter múltiplos logins OAuth para o mesmo provedor separados dentro de um agente.

Use `--force` quando um perfil de provedor salvo estiver travado, expirado ou vinculado à conta errada e o comando de login normal continuar reutilizando-o. `--force` exclui os perfis de autenticação salvos para esse provedor no diretório do agente selecionado e depois executa o mesmo fluxo de autenticação de provedor novamente. Ele não revoga credenciais no provedor; rotacione ou revogue-as no painel do provedor quando precisar de invalidação no lado do provedor.

```bash
openclaw models auth login --provider anthropic --force
```

### Por sessão (comando de chat)

Use `/model <alias-or-id>@<profileId>` para fixar uma credencial específica de provedor para a sessão atual (exemplos de ids de perfil: `anthropic:default`, `anthropic:work`).

Use `/model` (ou `/model list`) para um seletor compacto; use `/model status` para a visualização completa (candidatos + próximo perfil de autenticação, além de detalhes de endpoint do provedor quando configurados).

### Por agente (substituição pela CLI)

Defina uma substituição explícita de ordem de perfis de autenticação para um agente (armazenada no estado de autenticação SQLite desse agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Use `--agent <id>` para direcionar um agente específico; omita-o para usar o agente padrão configurado.
Ao depurar problemas de ordem, `openclaw models status --probe` mostra perfis armazenados omitidos como `excluded_by_auth_order` em vez de ignorá-los silenciosamente.
Ao depurar problemas de cooldown, lembre-se de que cooldowns de limite de taxa podem estar vinculados a um id de modelo, em vez de ao perfil inteiro do provedor.

Se você alterar a ordem de autenticação ou a fixação de perfil para um chat que já está em execução, envie `/new` ou `/reset` nesse chat para iniciar uma nova sessão. Sessões existentes podem manter a seleção atual de modelo/perfil até serem redefinidas.

## Solução de problemas

### "Nenhuma credencial encontrada"

Se o perfil da Anthropic estiver ausente, configure uma chave de API da Anthropic no **host do Gateway** ou configure o caminho de setup-token da Anthropic, depois verifique novamente:

```bash
openclaw models status
```

### Token expirando/expirado

Execute `openclaw models status` para confirmar qual perfil está expirando. Se um perfil de token da Anthropic estiver ausente ou expirado, atualize essa configuração via setup-token ou migre para uma chave de API da Anthropic.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
