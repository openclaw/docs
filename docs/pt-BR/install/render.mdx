---
read_when:
    - Implantando o OpenClaw no Render
    - Você quer uma implantação declarativa em nuvem com Blueprints do Render
summary: Implantar o OpenClaw no Render com Infraestrutura como Código
title: Render
x-i18n:
    generated_at: "2026-04-23T14:04:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
---

# Render

Implante o OpenClaw no Render usando Infraestrutura como Código. O Blueprint `render.yaml` incluído define toda a sua stack de forma declarativa — serviço, disco, variáveis de ambiente — para que você possa implantar com um único clique e versionar sua infraestrutura junto com seu código.

## Pré-requisitos

- Uma [conta no Render](https://render.com) (com camada gratuita disponível)
- Uma chave de API do seu [provedor de modelo](/pt-BR/providers) preferido

## Implantar com um Blueprint do Render

[Implantar no Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Clicar neste link irá:

1. Criar um novo serviço no Render a partir do Blueprint `render.yaml` na raiz deste repositório.
2. Construir a imagem Docker e implantar

Depois da implantação, a URL do seu serviço seguirá o padrão `https://<service-name>.onrender.com`.

## Entendendo o Blueprint

Blueprints do Render são arquivos YAML que definem sua infraestrutura. O `render.yaml` neste
repositório configura tudo o que é necessário para executar o OpenClaw:

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

Principais recursos do Blueprint usados:

| Recurso               | Finalidade                                                 |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Constrói a partir do Dockerfile do repositório             |
| `healthCheckPath`     | O Render monitora `/health` e reinicia instâncias não saudáveis |
| `generateValue: true` | Gera automaticamente um valor criptograficamente seguro    |
| `disk`                | Armazenamento persistente que sobrevive a reimplantações   |

## Escolhendo um plano

| Plano     | Hibernação         | Disco         | Melhor para                   |
| --------- | ------------------ | ------------- | ----------------------------- |
| Free      | Após 15 min ocioso | Não disponível | Testes, demonstrações         |
| Starter   | Nunca              | 1GB+          | Uso pessoal, equipes pequenas |
| Standard+ | Nunca              | 1GB+          | Produção, vários canais       |

O Blueprint usa `starter` por padrão. Para usar a camada gratuita, altere `plan: free` em
`render.yaml` no seu fork (mas observe: sem disco persistente, o estado do OpenClaw
é redefinido a cada implantação).

## Após a implantação

### Acesse a Control UI

O painel web está disponível em `https://<your-service>.onrender.com/`.

Conecte-se usando o segredo compartilhado configurado. Este modelo de implantação gera automaticamente
`OPENCLAW_GATEWAY_TOKEN` (encontre-o em **Dashboard → your service →
Environment**); se você substituí-lo por autenticação por senha, use essa senha
em vez disso.

## Recursos do Dashboard do Render

### Logs

Veja logs em tempo real em **Dashboard → your service → Logs**. Filtre por:

- Logs de build (criação da imagem Docker)
- Logs de implantação (inicialização do serviço)
- Logs de runtime (saída da aplicação)

### Acesso ao shell

Para depuração, abra uma sessão de shell em **Dashboard → your service → Shell**. O disco persistente é montado em `/data`.

### Variáveis de ambiente

Modifique variáveis em **Dashboard → your service → Environment**. As mudanças acionam uma reimplantação automática.

### Implantação automática

Se você usar o repositório original do OpenClaw, o Render não fará implantação automática do seu OpenClaw. Para atualizá-lo, execute uma sincronização manual do Blueprint pelo dashboard.

## Domínio personalizado

1. Vá para **Dashboard → your service → Settings → Custom Domains**
2. Adicione seu domínio
3. Configure o DNS conforme instruído (CNAME para `*.onrender.com`)
4. O Render provisiona automaticamente um certificado TLS

## Escalonamento

O Render oferece suporte a escalonamento horizontal e vertical:

- **Vertical**: altere o plano para obter mais CPU/RAM
- **Horizontal**: aumente a contagem de instâncias (plano Standard e superiores)

Para o OpenClaw, o escalonamento vertical geralmente é suficiente. O escalonamento horizontal exige sessões fixas ou gerenciamento de estado externo.

## Backups e migração

Exporte seu estado, configuração, perfis de autenticação e workspace a qualquer momento usando o
acesso ao shell no Dashboard do Render:

```bash
openclaw backup create
```

Isso cria um arquivo de backup portátil com o estado do OpenClaw mais qualquer
workspace configurado. Veja [Backup](/pt-BR/cli/backup) para detalhes.

## Solução de problemas

### O serviço não inicia

Verifique os logs de implantação no Dashboard do Render. Problemas comuns:

- `OPENCLAW_GATEWAY_TOKEN` ausente — verifique se está definido em **Dashboard → Environment**
- Incompatibilidade de porta — verifique se `OPENCLAW_GATEWAY_PORT=8080` está definido para que o Gateway se vincule à porta esperada pelo Render

### Inicialização lenta a frio (camada gratuita)

Serviços da camada gratuita hibernam após 15 minutos de inatividade. A primeira solicitação após a hibernação leva alguns segundos enquanto o contêiner inicia. Faça upgrade para o plano Starter para manter sempre ativo.

### Perda de dados após reimplantação

Isso acontece na camada gratuita (sem disco persistente). Faça upgrade para um plano pago ou
exporte regularmente um backup completo via `openclaw backup create` no shell do Render.

### Falhas na verificação de integridade

O Render espera uma resposta 200 de `/health` em até 30 segundos. Se os builds forem bem-sucedidos, mas as implantações falharem, o serviço pode estar demorando demais para iniciar. Verifique:

- Logs de build em busca de erros
- Se o contêiner é executado localmente com `docker build && docker run`

## Próximos passos

- Configure canais de mensagens: [Channels](/pt-BR/channels)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualizando](/pt-BR/install/updating)
