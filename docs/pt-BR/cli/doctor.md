---
read_when:
    - Você tem problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação rápida de integridade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:25:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Verificações de integridade + correções rápidas para o Gateway e canais.

Relacionado:

- Solução de problemas: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Auditoria de segurança: [Segurança](/pt-BR/gateway/security)

## Exemplos

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opções

- `--no-workspace-suggestions`: desabilita sugestões de memória/pesquisa do workspace
- `--yes`: aceita os padrões sem solicitar confirmação
- `--repair`: aplica os reparos recomendados sem solicitar confirmação
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configuração personalizada de serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (Cron, Telegram, sem terminal) ignoram prompts.
- Desempenho: execuções não interativas de `doctor` ignoram o carregamento antecipado de Plugins para manter rápidas as verificações de integridade headless. Sessões interativas ainda carregam totalmente os Plugins quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões e podem arquivá-los como `.deleted.<timestamp>` para recuperar espaço com segurança.
- O Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de tarefas Cron e pode reescrevê-los no local antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- O Doctor repara dependências de runtime ausentes de Plugins incluídos sem gravar em instalações globais empacotadas. Para instalações npm com propriedade de root ou unidades systemd endurecidas, defina `OPENCLAW_PLUGIN_STAGE_DIR` como um diretório gravável, como `/var/lib/openclaw/plugin-runtime-deps`.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor for responsável pelo ciclo de vida do Gateway. O Doctor ainda reporta a integridade do Gateway/serviço e aplica reparos não relacionados a serviço, mas ignora instalação/inicialização/reinicialização/bootstrap de serviço e limpeza de serviços legados.
- O Doctor migra automaticamente a configuração plana legada de Talk (`talk.voiceId`, `talk.modelId` e similares) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não reportam/aplicam mais a normalização de Talk quando a única diferença é a ordem das chaves do objeto.
- O Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embeddings estiverem ausentes.
- Se o modo sandbox estiver ativado, mas o Docker não estiver disponível, o Doctor reportará um aviso de alto sinal com correção (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, o Doctor reportará um aviso somente leitura e não gravará credenciais fallback em texto simples.
- Se a inspeção de SecretRef do canal falhar em um caminho de correção, o Doctor continuará e reportará um aviso em vez de encerrar antecipadamente.
- A resolução automática de nomes de usuário em `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho de comando atual. Se a inspeção do token não estiver disponível, o Doctor reportará um aviso e ignorará a resolução automática nessa execução.

## macOS: substituições de ambiente do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de “não autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
