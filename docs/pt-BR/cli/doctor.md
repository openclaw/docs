---
read_when:
    - Você tem problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação rápida de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:43:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Verificações de integridade + correções rápidas para o gateway e os canais.

Relacionado:

- Solução de problemas: [Troubleshooting](/pt-BR/gateway/troubleshooting)
- Auditoria de segurança: [Security](/pt-BR/gateway/security)

## Exemplos

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opções

- `--no-workspace-suggestions`: desativa sugestões de memória/pesquisa do workspace
- `--yes`: aceita os padrões sem perguntar
- `--repair`: aplica os reparos recomendados sem perguntar
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configuração de serviço personalizada quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras
- `--generate-gateway-token`: gera e configura um token do gateway
- `--deep`: examina serviços do sistema em busca de instalações extras do gateway

Notas:

- Prompts interativos (como correções de chaveiro/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (Cron, Telegram, sem terminal) ignoram prompts.
- Desempenho: execuções não interativas do `doctor` ignoram o carregamento antecipado de plugins para que as verificações de integridade headless continuem rápidas. Sessões interativas ainda carregam completamente os plugins quando uma verificação precisa da contribuição deles.
- `--fix` (alias de `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões e podem arquivá-los como `.deleted.<timestamp>` para recuperar espaço com segurança.
- O Doctor também examina `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de jobs Cron e pode regravá-los no local antes que o agendador precise normalizá-los automaticamente em runtime.
- O Doctor repara dependências de runtime ausentes de plugins incluídos sem gravar em instalações globais empacotadas. Para instalações npm pertencentes a root ou unidades systemd protegidas, defina `OPENCLAW_PLUGIN_STAGE_DIR` como um diretório gravável, como `/var/lib/openclaw/plugin-runtime-deps`.
- O Doctor migra automaticamente a configuração plana legada de Talk (`talk.voiceId`, `talk.modelId` e similares) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais a normalização de Talk quando a única diferença é a ordem das chaves do objeto.
- O Doctor inclui uma verificação de prontidão de pesquisa em memória e pode recomendar `openclaw configure --section model` quando credenciais de embedding estiverem ausentes.
- Se o modo sandbox estiver ativado, mas o Docker não estiver disponível, o doctor relata um aviso de alto sinal com a correção (`instale o Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, o doctor relata um aviso somente leitura e não grava credenciais fallback em texto simples.
- Se a inspeção de SecretRef do canal falhar em um caminho de correção, o doctor continua e relata um aviso em vez de encerrar antecipadamente.
- A resolução automática de nome de usuário em `allowFrom` do Telegram (`doctor --fix`) requer um token do Telegram resolvível no caminho de comando atual. Se a inspeção do token não estiver disponível, o doctor relata um aviso e ignora a resolução automática nessa execução.

## macOS: substituições de ambiente `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de “não autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [referência da CLI](/pt-BR/cli)
- [Doctor do gateway](/pt-BR/gateway/doctor)
