---
read_when:
    - Implantação do OpenClaw no Render
    - Você quer uma implantação declarativa na nuvem com Render Blueprints
summary: Implante o OpenClaw no Render com infraestrutura como código
title: Renderizar
x-i18n:
    generated_at: "2026-07-12T00:01:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Implante o OpenClaw no [Render](https://render.com) usando o Blueprint `render.yaml` do repositório. Ele declara o serviço, o disco e as variáveis de ambiente em um único arquivo.

## Pré-requisitos

- Uma [conta do Render](https://render.com) (plano gratuito disponível)
- Uma chave de API do seu [provedor de modelos](/pt-BR/providers) preferido

## Implantação

[Implantar no Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Isso cria um serviço do Render com base no `render.yaml`, compila a imagem Docker e a implanta. A URL do seu serviço segue o padrão `https://<service-name>.onrender.com`.

## O Blueprint

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # gera automaticamente um token seguro
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Recurso               | Finalidade                                                        |
| --------------------- | ----------------------------------------------------------------- |
| `runtime: docker`     | Compila usando o Dockerfile do repositório                         |
| `healthCheckPath`     | O Render monitora `/health` e reinicia instâncias não íntegras     |
| `generateValue: true` | Gera automaticamente um valor criptograficamente seguro           |
| `disk`                | Armazenamento persistente que permanece após novas implantações    |

## Escolha de um plano

| Plano     | Desativação automática       | Disco          | Mais indicado para             |
| --------- | ---------------------------- | -------------- | ------------------------------ |
| Free      | Após 15 min de inatividade   | Não disponível | Testes e demonstrações         |
| Starter   | Nunca                        | 1 GB ou mais   | Uso pessoal e equipes pequenas |
| Standard+ | Nunca                        | 1 GB ou mais   | Produção e múltiplos canais     |

O Blueprint usa `starter` por padrão. Para usar o plano gratuito, altere `plan: free` no `render.yaml` do seu fork — observe que, sem um disco persistente, o estado do OpenClaw é redefinido a cada implantação.

## Após a implantação

### Acessar a interface de controle

O painel web está disponível em `https://<your-service>.onrender.com/`. Conecte-se usando o segredo compartilhado: o `OPENCLAW_GATEWAY_TOKEN` gerado automaticamente (encontre-o em **Dashboard → your service → Environment**) ou sua senha, caso tenha mudado para autenticação por senha.

### Logs

**Dashboard → your service → Logs** exibe os logs de compilação (criação da imagem Docker), os logs de implantação (inicialização do serviço) e os logs de execução (saída do aplicativo).

### Acesso ao shell

**Dashboard → your service → Shell** abre uma sessão de shell. O disco persistente é montado em `/data`.

### Variáveis de ambiente

Edite as variáveis em **Dashboard → your service → Environment**. As alterações acionam automaticamente uma nova implantação.

### Implantação automática

O Render realiza uma nova implantação automaticamente quando a ramificação conectada do repositório recebe um novo commit. Se você implantou diretamente de `openclaw/openclaw` em vez de usar seu próprio fork, não terá acesso de envio para acionar esse processo. Nesse caso, atualize executando uma sincronização manual do Blueprint no Dashboard ou aponte o serviço para seu próprio fork.

## Domínio personalizado

1. **Dashboard → your service → Settings → Custom Domains**
2. Adicione seu domínio
3. Configure o DNS conforme as instruções (CNAME para `*.onrender.com`)
4. O Render provisiona automaticamente um certificado TLS

## Escalonamento

- **Vertical**: altere o plano para obter mais CPU/RAM. Geralmente é suficiente para o OpenClaw.
- **Horizontal**: aumente a quantidade de instâncias (plano Standard ou superior). Exige sessões persistentes ou gerenciamento externo de estado, pois o OpenClaw mantém o estado de execução no disco local.

## Backups e migração

No shell do Dashboard do Render, exporte o estado, a configuração, os perfis de autenticação e o espaço de trabalho a qualquer momento:

```bash
openclaw backup create
```

Isso cria um arquivo de backup portátil. Consulte [Backup](/pt-BR/cli/backup).

## Solução de problemas

### O serviço não inicia

Verifique os logs de implantação no Dashboard do Render. Problemas comuns:

- `OPENCLAW_GATEWAY_TOKEN` ausente — verifique se ele está definido em **Dashboard → Environment**
- Incompatibilidade de porta — certifique-se de que `OPENCLAW_GATEWAY_PORT=8080` para que o Gateway seja associado à porta esperada pelo Render

### Inicializações a frio lentas (plano gratuito)

Os serviços do plano gratuito são desativados após 15 minutos de inatividade; a primeira solicitação após a desativação leva alguns segundos enquanto o contêiner é iniciado. Mude para o plano Starter para manter o serviço sempre ativo.

### Perda de dados após uma nova implantação

Isso ocorre no plano gratuito (sem disco persistente). Mude para um plano pago ou exporte regularmente um backup com `openclaw backup create` no shell do Render.

### Falhas na verificação de integridade

Se as compilações forem concluídas, mas as implantações falharem, o serviço poderá estar demorando demais para iniciar ou `/health` poderá não estar acessível. Verifique:

- Os logs de compilação em busca de erros
- Se o contêiner é executado localmente com `docker build && docker run`

## Próximas etapas

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualização](/pt-BR/install/updating)
