---
read_when:
    - Depuração da autenticação do modelo ou da expiração do OAuth
    - Documentando autenticação ou armazenamento de credenciais
summary: 'Autenticação de modelos: OAuth, chaves de API, reutilização da CLI do Claude e setup-token da Anthropic'
title: Autenticação
x-i18n:
    generated_at: "2026-05-07T13:16:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Esta página é a referência de autenticação de **provedor de modelos** (chaves de API, OAuth, reutilização da CLI do Claude e setup-token da Anthropic). Para autenticação de **conexão do gateway** (token, senha, proxy confiável), consulte [Configuração](/pt-BR/gateway/configuration) e [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
</Note>

O OpenClaw é compatível com OAuth e chaves de API para provedores de modelos. Para hosts de gateway sempre ativos, as chaves de API geralmente são a opção mais previsível. Fluxos de assinatura/OAuth também são compatíveis quando correspondem ao modelo de conta do seu provedor.

Consulte [/concepts/oauth](/pt-BR/concepts/oauth) para ver o fluxo completo de OAuth e o layout de armazenamento.
Para autenticação baseada em SecretRef (provedores `env`/`file`/`exec`), consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).
Para regras de elegibilidade de credenciais/códigos de motivo usadas por `models status --probe`, consulte
[Semântica de credenciais de autenticação](/pt-BR/auth-credential-semantics).

## Configuração recomendada (chave de API, qualquer provedor)

Se você estiver executando um gateway de longa duração, comece com uma chave de API para o provedor escolhido.
Especificamente para a Anthropic, a autenticação por chave de API ainda é a configuração de servidor mais previsível, mas o OpenClaw também é compatível com a reutilização de um login local da CLI do Claude.

1. Crie uma chave de API no console do seu provedor.
2. Coloque-a no **host do gateway** (a máquina que executa `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se o Gateway for executado sob systemd/launchd, prefira colocar a chave em
   `~/.openclaw/.env` para que o daemon possa lê-la:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Em seguida, reinicie o daemon (ou reinicie o processo do Gateway) e verifique novamente:

```bash
openclaw models status
openclaw doctor
```

Se você preferir não gerenciar variáveis de ambiente manualmente, o onboarding pode armazenar
chaves de API para uso pelo daemon: `openclaw onboard`.

Consulte [Ajuda](/pt-BR/help) para obter detalhes sobre herança de ambiente (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: CLI do Claude e compatibilidade de tokens

A autenticação por setup-token da Anthropic ainda está disponível no OpenClaw como um caminho de token compatível. Desde então, a equipe da Anthropic nos informou que o uso da CLI do Claude no estilo OpenClaw é permitido novamente, então o OpenClaw trata a reutilização da CLI do Claude e o uso de `claude -p` como sancionados para essa integração, a menos que a Anthropic publique uma nova política. Quando a reutilização da CLI do Claude está disponível no host, esse agora é o caminho preferido.

Para hosts de gateway de longa duração, uma chave de API da Anthropic ainda é a configuração mais previsível. Se quiser reutilizar um login existente do Claude no mesmo host, use o caminho da CLI do Claude da Anthropic no onboarding/configuração.

Configuração de host recomendada para reutilização da CLI do Claude:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esta é uma configuração em duas etapas:

1. Faça login do próprio Claude Code na Anthropic no host do gateway.
2. Informe ao OpenClaw para trocar a seleção de modelos da Anthropic para o backend local `claude-cli`
   e armazenar o perfil de autenticação correspondente do OpenClaw.

Se `claude` não estiver em `PATH`, instale o Claude Code primeiro ou defina
`agents.defaults.cliBackends.claude-cli.command` como o caminho real do binário.

Entrada manual de token (qualquer provedor; grava `auth-profiles.json` + atualiza a configuração):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` armazena apenas credenciais. O formato canônico é:

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

O OpenClaw espera o formato canônico `version` + `profiles` em tempo de execução. Se uma instalação mais antiga ainda tiver um arquivo plano como `{ "openrouter": { "apiKey": "..." } }`, execute `openclaw doctor --fix` para regravá-lo como um perfil de chave de API `openrouter:default`; o doctor mantém uma cópia `.legacy-flat.*.bak` ao lado do original. Detalhes de endpoint como `baseUrl`, `api`, IDs de modelos, cabeçalhos e timeouts pertencem a `models.providers.<id>` em `openclaw.json` ou `models.json`, não a `auth-profiles.json`.

Rotas de autenticação externas, como Bedrock `auth: "aws-sdk"`, também não são credenciais. Se quiser uma rota Bedrock nomeada, coloque `auth.profiles.<id>.mode: "aws-sdk"` em `openclaw.json`; não grave `type: "aws-sdk"` em `auth-profiles.json`. `openclaw doctor --fix` move marcadores legados do AWS SDK do armazenamento de credenciais para os metadados de configuração.

Referências de perfil de autenticação também são compatíveis com credenciais estáticas:

- credenciais `api_key` podem usar `keyRef: { source, provider, id }`
- credenciais `token` podem usar `tokenRef: { source, provider, id }`
- Perfis em modo OAuth não são compatíveis com credenciais SecretRef; se `auth.profiles.<id>.mode` estiver definido como `"oauth"`, a entrada `keyRef`/`tokenRef` baseada em SecretRef para esse perfil será rejeitada.

Verificação adequada para automação (saída `1` quando expirado/ausente, `2` quando prestes a expirar):

```bash
openclaw models status --check
```

Sondagens de autenticação ao vivo:

```bash
openclaw models status --probe
```

Observações:

- As linhas de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
- Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem relata
  `excluded_by_auth_order` para esse perfil em vez de tentar usá-lo.
- Se a autenticação existir, mas o OpenClaw não conseguir resolver um candidato de modelo sondável para
  esse provedor, a sondagem relata `status: no_model`.
- Cooldowns de limite de taxa podem ter escopo por modelo. Um perfil em cooldown para um
  modelo ainda pode ser utilizável para um modelo irmão no mesmo provedor.

Scripts opcionais de operações (systemd/Termux) estão documentados aqui:
[Scripts de monitoramento de autenticação](/pt-BR/help/scripts#auth-monitoring-scripts)

## Observação sobre a Anthropic

O backend `claude-cli` da Anthropic voltou a ser compatível.

- A equipe da Anthropic nos informou que esse caminho de integração do OpenClaw é permitido novamente.
- Portanto, o OpenClaw trata a reutilização da CLI do Claude e o uso de `claude -p` como sancionados
  para execuções com suporte da Anthropic, a menos que a Anthropic publique uma nova política.
- As chaves de API da Anthropic continuam sendo a escolha mais previsível para hosts de gateway
  de longa duração e controle explícito de cobrança no lado do servidor.

## Verificar o status de autenticação de modelos

```bash
openclaw models status
openclaw doctor
```

## Comportamento de rotação de chaves de API (gateway)

Alguns provedores são compatíveis com tentar novamente uma solicitação com chaves alternativas quando uma chamada de API
atinge um limite de taxa do provedor.

- Ordem de prioridade:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição única)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Provedores Google também incluem `GOOGLE_API_KEY` como fallback adicional.
- A mesma lista de chaves é deduplicada antes do uso.
- O OpenClaw tenta novamente com a próxima chave somente para erros de limite de taxa (por exemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` ou
  `workers_ai ... quota limit exceeded`).
- Erros que não são de limite de taxa não são tentados novamente com chaves alternativas.
- Se todas as chaves falharem, o erro final da última tentativa será retornado.

## Controlar qual credencial é usada

### Por sessão (comando de chat)

Use `/model <alias-or-id>@<profileId>` para fixar uma credencial específica de provedor para a sessão atual (exemplos de IDs de perfil: `anthropic:default`, `anthropic:work`).

Use `/model` (ou `/model list`) para um seletor compacto; use `/model status` para a visualização completa (candidatos + próximo perfil de autenticação, além de detalhes de endpoint do provedor quando configurados).

### Por agente (substituição da CLI)

Defina uma substituição explícita da ordem de perfis de autenticação para um agente (armazenada em `auth-state.json` desse agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Use `--agent <id>` para direcionar a um agente específico; omita-o para usar o agente padrão configurado.
Ao depurar problemas de ordem, `openclaw models status --probe` mostra perfis armazenados omitidos como `excluded_by_auth_order` em vez de ignorá-los silenciosamente.
Ao depurar problemas de cooldown, lembre-se de que cooldowns de limite de taxa podem estar vinculados
a um ID de modelo em vez do perfil inteiro do provedor.

## Solução de problemas

### "Nenhuma credencial encontrada"

Se o perfil da Anthropic estiver ausente, configure uma chave de API da Anthropic no
**host do gateway** ou configure o caminho de setup-token da Anthropic, depois verifique novamente:

```bash
openclaw models status
```

### Token prestes a expirar/expirado

Execute `openclaw models status` para confirmar qual perfil está prestes a expirar. Se um
perfil de token da Anthropic estiver ausente ou expirado, atualize essa configuração via
setup-token ou migre para uma chave de API da Anthropic.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
