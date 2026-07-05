---
read_when:
    - Revisión de la postura de seguridad o de escenarios de amenaza
    - Trabajar en funciones de seguridad o respuestas de auditoría
summary: Modelo de amenazas de OpenClaw asignado al marco MITRE ATLAS
title: Modelo de amenazas (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-05T11:43:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Versión:** 1.0-draft | **Marco:** [MITRE ATLAS](https://atlas.mitre.org/) (Panorama de amenazas adversarias para sistemas de IA) + diagramas de flujo de datos

Este modelo de amenazas documenta amenazas adversarias contra la plataforma de agentes de IA OpenClaw y el marketplace de Skills ClawHub. Es un documento vivo mantenido por la comunidad de OpenClaw. Consulta [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL) para saber cómo reportar nuevas amenazas, proponer cadenas de ataque o sugerir mitigaciones.

**Recursos clave de ATLAS:** [Técnicas](https://atlas.mitre.org/techniques/) | [Tácticas](https://atlas.mitre.org/tactics/) | [Casos de estudio](https://atlas.mitre.org/studies/) | [GitHub de ATLAS](https://github.com/mitre-atlas/atlas-data) | [Contribuir a ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Alcance

| Componente                       | Incluido | Notas                                                |
| -------------------------------- | -------- | ---------------------------------------------------- |
| Runtime de agentes OpenClaw      | Sí       | Ejecución central de agentes, llamadas a herramientas, sesiones |
| Gateway                          | Sí       | Autenticación, enrutamiento, integración de canales  |
| Integraciones de canales         | Sí       | WhatsApp, Telegram, Discord, Signal, Slack, etc.     |
| Marketplace ClawHub              | Sí       | Publicación, moderación y distribución de Skills     |
| Servidores MCP                   | Sí       | Proveedores de herramientas externas                 |
| Dispositivos de usuario          | Parcial  | Aplicaciones móviles, clientes de escritorio         |

Los reportes fuera de alcance y los patrones de falsos positivos (exposición a internet público, cadenas solo de inyección de prompts sin omisión de frontera, operadores mutuamente no confiables que comparten un host Gateway, y otros) se enumeran en [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md); ese archivo es la fuente de verdad actual para el alcance de reportes de vulnerabilidades, no esta página.

## 2. Arquitectura del sistema

### 2.1 Fronteras de confianza

```text
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device pairing (1h DM pairing / 5m node pairing TTL)   │   │
│  │  • AllowFrom / allowlist validation                       │   │
│  │  • Token / password / Tailscale auth                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox (default) or host (exec approvals)      │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (random-boundary XML tags)   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Static pattern + AST-adjacent moderation scanning      │   │
│  │  • LLM-based agentic risk review + VirusTotal scanning    │   │
│  │  • GitHub account age verification (14 days)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujos de datos

| Flujo | Origen  | Destino | Datos                 | Protección           |
| ----- | ------- | ------- | --------------------- | -------------------- |
| F1    | Canal   | Gateway | Mensajes de usuario   | TLS, AllowFrom       |
| F2    | Gateway | Agente  | Mensajes enrutados    | Aislamiento de sesión |
| F3    | Agente  | Herramientas | Invocaciones de herramientas | Aplicación de políticas |
| F4    | Agente  | Externo | Solicitudes `web_fetch` | Bloqueo de SSRF      |
| F5    | ClawHub | Agente  | Código de Skill       | Moderación, escaneo  |
| F6    | Agente  | Canal   | Respuestas            | Filtrado de salida   |

---

## 3. Análisis de amenazas por táctica de ATLAS

### 3.1 Reconocimiento (AML.TA0002)

#### T-RECON-001: Descubrimiento de endpoints de agentes

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0006 - Escaneo activo                                           |
| **Descripción**         | El atacante escanea endpoints Gateway de OpenClaw expuestos          |
| **Vector de ataque**    | Escaneo de red, consultas de Shodan, enumeración de DNS              |
| **Componentes afectados** | Gateway, endpoints de API expuestos                                |
| **Mitigaciones actuales** | Opción de autenticación Tailscale, vinculación a local loopback de forma predeterminada |
| **Riesgo residual**     | Medio - los Gateways públicos son detectables                        |
| **Recomendaciones**     | Documentar el despliegue seguro, agregar limitación de tasa en endpoints de descubrimiento |

#### T-RECON-002: Sondeo de integración de canales

| Atributo                | Valor                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0006 - Escaneo activo                                        |
| **Descripción**         | El atacante sondea canales de mensajería para identificar cuentas gestionadas por IA |
| **Vector de ataque**    | Envío de mensajes de prueba, observación de patrones de respuesta  |
| **Componentes afectados** | Todas las integraciones de canales                                |
| **Mitigaciones actuales** | Ninguna específica                                                |
| **Riesgo residual**     | Bajo - valor limitado solo a partir del descubrimiento             |
| **Recomendaciones**     | Considerar la aleatorización del tiempo de respuesta               |

---

### 3.2 Acceso inicial (AML.TA0004)

#### T-ACCESS-001: Intercepción del código de emparejamiento

| Atributo                | Valor                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Acceso a la API de inferencia de modelos de IA                                                          |
| **Descripción**         | El atacante intercepta un código de emparejamiento durante la ventana de emparejamiento (1 h DM/genérico, 5 min nodo) |
| **Vector de ataque**    | Observación por encima del hombro, sniffing de red, ingeniería social                                                |
| **Componentes afectados** | Sistema de emparejamiento de dispositivos                                                                          |
| **Mitigaciones actuales** | TTL de 1 h (emparejamiento DM/genérico), TTL de 5 min (emparejamiento de nodo); códigos enviados por el canal existente |
| **Riesgo residual**     | Medio - ventana de emparejamiento explotable                                                                        |
| **Recomendaciones**     | Reducir la ventana de emparejamiento, agregar un paso de confirmación                                               |

#### T-ACCESS-002: Suplantación de AllowFrom

| Atributo                | Valor                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - Acceso a la API de inferencia de modelos de IA                     |
| **Descripción**         | El atacante suplanta una identidad de remitente permitida en un canal          |
| **Vector de ataque**    | Dependiente del canal - suplantación de número telefónico, impersonación de nombre de usuario |
| **Componentes afectados** | Validación AllowFrom por canal                                                |
| **Mitigaciones actuales** | Verificación de identidad específica del canal                                |
| **Riesgo residual**     | Medio - algunos canales siguen siendo vulnerables a la suplantación            |
| **Recomendaciones**     | Documentar los riesgos específicos del canal, agregar verificación criptográfica cuando sea posible |

#### T-ACCESS-003: Robo de tokens

| Atributo                | Valor                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - Acceso a la API de inferencia de modelos de IA         |
| **Descripción**         | El atacante roba tokens de autenticación de archivos de configuración/credenciales |
| **Vector de ataque**    | Malware, acceso no autorizado al dispositivo, exposición de copias de seguridad de configuración |
| **Componentes afectados** | Almacenamiento de credenciales de canal/proveedor, almacenamiento de configuración |
| **Mitigaciones actuales** | Permisos de archivo                                               |
| **Riesgo residual**     | Alto - tokens almacenados en texto plano en disco                  |
| **Recomendaciones**     | Implementar cifrado de tokens en reposo, agregar rotación de tokens |

---

### 3.3 Ejecución (AML.TA0005)

#### T-EXEC-001: Inyección directa de prompts

| Atributo                | Valor                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - Inyección de prompts en LLM: directa                                                                                         |
| **Descripción**         | El atacante envía prompts manipulados para alterar el comportamiento del agente                                                               |
| **Vector de ataque**    | Mensajes de canal que contienen instrucciones adversarias                                                                                     |
| **Componentes afectados** | LLM del agente, todas las superficies de entrada                                                                                            |
| **Mitigaciones actuales** | Detección de patrones, envoltura de contenido externo; tratado como fuera de alcance para informes de vulnerabilidad si no hay una elusión de límite (ver `SECURITY.md`) |
| **Riesgo residual**     | Crítico - solo detección, sin bloqueo; los ataques sofisticados la eluden                                                                    |
| **Recomendaciones**     | Validación de salida y confirmación del usuario para acciones sensibles, aplicadas sobre la detección existente                               |

#### T-EXEC-002: Inyección indirecta de prompts

| Atributo                | Valor                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.001 - Inyección de prompts en LLM: indirecta                                                                |
| **Descripción**         | El atacante incrusta instrucciones maliciosas en contenido obtenido                                                   |
| **Vector de ataque**    | URL maliciosas, correos electrónicos contaminados, webhooks comprometidos                                             |
| **Componentes afectados** | `web_fetch`, ingesta de correo electrónico, fuentes de datos externas                                               |
| **Mitigaciones actuales** | Envoltura de contenido con marcadores aleatorios de estilo XML con límites, normalización de homógrafos/tokens especiales y aviso de seguridad |
| **Riesgo residual**     | Alto - el LLM aún puede ignorar las instrucciones de envoltura                                                        |
| **Recomendaciones**     | Contextos de ejecución separados para contenido envuelto                                                              |

#### T-EXEC-003: Inyección de argumentos de herramientas

| Atributo                | Valor                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0051.000 - Inyección de prompts en LLM: directa         |
| **Descripción**         | El atacante manipula argumentos de herramientas mediante inyección de prompts |
| **Vector de ataque**    | Prompts manipulados que influyen en los valores de parámetros de herramientas |
| **Componentes afectados** | Todas las invocaciones de herramientas                      |
| **Mitigaciones actuales** | Aprobaciones Exec para comandos peligrosos                  |
| **Riesgo residual**     | Alto - depende del criterio del usuario                      |
| **Recomendaciones**     | Validación de argumentos, llamadas a herramientas parametrizadas |

#### T-EXEC-004: Elusión de aprobación Exec

| Atributo                | Valor                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Crear datos adversarios                                                                                                                                               |
| **Descripción**         | El atacante crea comandos que eluden la lista de permitidos de aprobación                                                                                                         |
| **Vector de ataque**    | Ofuscación de comandos, explotación de alias, manipulación de rutas                                                                                                               |
| **Componentes afectados** | `src/infra/exec-approvals*.ts`, lista de comandos permitidos                                                                                                                     |
| **Mitigaciones actuales** | Lista de permitidos + modo de solicitud, además de normalización de comandos (desenvoltura de dispatch-wrapper, detección de inline-eval, análisis de cadenas de shell)          |
| **Riesgo residual**     | Alto - la normalización reduce pero no elimina la elusión mediante ofuscación; los hallazgos de solo paridad entre rutas Exec se tratan como endurecimiento, no como vulnerabilidades (ver `SECURITY.md`) |
| **Recomendaciones**     | Seguir ampliando la cobertura de normalización de comandos contra nuevas técnicas de ofuscación                                                                                   |

---

### 3.4 Persistencia (AML.TA0006)

#### T-PERSIST-001: Instalación de skill maliciosa

| Atributo                | Valor                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Compromiso de la cadena de suministro: software de IA                                                     |
| **Descripción**         | El atacante publica una skill maliciosa en ClawHub                                                                        |
| **Vector de ataque**    | Crear cuenta, publicar skill con código malicioso oculto                                                                  |
| **Componentes afectados** | ClawHub, carga de skills, ejecución del agente                                                                           |
| **Mitigaciones actuales** | Verificación de antigüedad de cuenta de GitHub, análisis estático de patrones/adyacente a AST, revisión agéntica de riesgos basada en LLM, análisis con VirusTotal |
| **Riesgo residual**     | Alto - existen capas de detección, pero las skills aún se ejecutan con privilegios de agente y sin sandboxing de ejecución |
| **Recomendaciones**     | Sandboxing de ejecución de skills, revisión comunitaria ampliada                                                          |

#### T-PERSIST-002: Envenenamiento de actualización de skill

| Atributo                | Valor                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Compromiso de la cadena de suministro: software de IA   |
| **Descripción**         | El atacante compromete una skill popular y publica una actualización maliciosa |
| **Vector de ataque**    | Compromiso de cuenta, ingeniería social del propietario de la skill     |
| **Componentes afectados** | Versionado de ClawHub, flujos de actualización automática              |
| **Mitigaciones actuales** | Huellas de versión, nueva ejecución de moderación/análisis en versiones nuevas |
| **Riesgo residual**     | Alto - las actualizaciones automáticas pueden descargar versiones maliciosas antes de que finalice la revisión |
| **Recomendaciones**     | Firma de actualizaciones, capacidad de reversión, fijación de versiones |

#### T-PERSIST-003: Manipulación de la configuración del agente

| Atributo                | Valor                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Compromiso de la cadena de suministro: Datos    |
| **Descripción**         | El atacante modifica la configuración del agente para persistir el acceso |
| **Vector de ataque**    | Modificación del archivo de configuración, inyección de ajustes |
| **Componentes afectados** | Configuración del agente, políticas de herramientas             |
| **Mitigaciones actuales** | Permisos de archivo                                           |
| **Riesgo residual**     | Medio - requiere acceso local                                  |
| **Recomendaciones**     | Verificación de integridad de la configuración, registro de auditoría para cambios de configuración |

---

### 3.5 Evasión de defensas (AML.TA0007)

#### T-EVADE-001: Omisión de patrones de moderación

| Atributo                | Valor                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Crear datos adversariales                                                 |
| **Descripción**         | El atacante crea contenido de skill para evadir las comprobaciones de moderación de ClawHub |
| **Vector de ataque**    | Homoglifos Unicode, trucos de codificación, carga dinámica                            |
| **Componentes afectados** | Canalización de moderación/escaneo de ClawHub                                      |
| **Mitigaciones actuales** | Reglas de patrones estáticos, escaneo de código adyacente a AST, revisión de riesgo agéntico con LLM, VirusTotal |
| **Riesgo residual**     | Medio - la ofuscación novedosa aún puede eludir las heurísticas por capas             |
| **Recomendaciones**     | Seguir ampliando el corpus de patrones/comportamientos a medida que se encuentren nuevas evasiones |

#### T-EVADE-002: Escape de envoltorio de contenido

| Atributo                | Valor                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Crear datos adversariales                                                                         |
| **Descripción**         | El atacante crea contenido que escapa del contexto del envoltorio de contenido externo                        |
| **Vector de ataque**    | Manipulación de etiquetas, confusión de contexto, anulación de instrucciones                                  |
| **Componentes afectados** | Envoltura de contenido externo                                                                              |
| **Mitigaciones actuales** | Marcadores de estilo XML con límite aleatorio + aviso de seguridad, además de detección de suplantación de marcadores con homoglifos/variantes de espacios en blanco |
| **Riesgo residual**     | Medio - se descubren escapes novedosos con regularidad                                                        |
| **Recomendaciones**     | Validación del lado de salida además de la envoltura del lado de entrada                                      |

---

### 3.6 Descubrimiento (AML.TA0008)

#### T-DISC-001: Enumeración de herramientas

| Atributo                | Valor                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acceso a la API de inferencia del modelo de IA |
| **Descripción**         | El atacante enumera las herramientas disponibles mediante prompts |
| **Vector de ataque**    | Consultas de estilo "¿Qué herramientas tienes?"       |
| **Componentes afectados** | Registro de herramientas del agente                 |
| **Mitigaciones actuales** | Ninguna específica                                  |
| **Riesgo residual**     | Bajo - las herramientas suelen estar documentadas     |
| **Recomendaciones**     | Considerar controles de visibilidad de herramientas   |

#### T-DISC-002: Extracción de datos de sesión

| Atributo                | Valor                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acceso a la API de inferencia del modelo de IA |
| **Descripción**         | El atacante extrae datos sensibles del contexto de sesión |
| **Vector de ataque**    | Consultas "¿Qué discutimos?", sondeo del contexto       |
| **Componentes afectados** | Transcripciones de sesión, ventana de contexto        |
| **Mitigaciones actuales** | Aislamiento de sesión por remitente (clave `agent:channel:peer`) |
| **Riesgo residual**     | Medio - los datos dentro de la sesión son accesibles por diseño |
| **Recomendaciones**     | Redacción de datos sensibles en el contexto             |

---

### 3.7 Recopilación y exfiltración (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Robo de datos mediante web_fetch

| Atributo                | Valor                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Recopilación                                                         |
| **Descripción**         | El atacante exfiltra datos indicando al agente que los envíe a una URL externa   |
| **Vector de ataque**    | Inyección de prompt que hace que el agente haga POST de datos a un servidor del atacante |
| **Componentes afectados** | Herramienta `web_fetch`                                                        |
| **Mitigaciones actuales** | Bloqueo SSRF para redes internas/privadas (fijación DNS + bloqueo de IP)       |
| **Riesgo residual**     | Alto - las URL externas arbitrarias siguen permitidas                            |
| **Recomendaciones**     | Lista de URL permitidas, conciencia de clasificación de datos                    |

#### T-EXFIL-002: Envío de mensajes no autorizado

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Recopilación                                             |
| **Descripción**         | El atacante hace que el agente envíe mensajes que contienen datos sensibles |
| **Vector de ataque**    | Inyección de prompt que hace que el agente envíe un mensaje al atacante |
| **Componentes afectados** | Herramienta de mensajes, integraciones de canales                 |
| **Mitigaciones actuales** | Control de envío de mensajes salientes                            |
| **Riesgo residual**     | Medio - el control puede ser eludido                                |
| **Recomendaciones**     | Confirmación explícita para nuevos destinatarios                     |

#### T-EXFIL-003: Recolección de credenciales

| Atributo                | Valor                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Recopilación                                                                                                                                 |
| **Descripción**         | Una skill maliciosa recolecta credenciales del contexto del agente                                                                                       |
| **Vector de ataque**    | El código de la skill lee variables de entorno, archivos de configuración                                                                                |
| **Componentes afectados** | Entorno de ejecución de skills                                                                                                                         |
| **Mitigaciones actuales** | Escaneo de patrones de credenciales en ClawHub (secretos codificados, acceso a variables de entorno de credenciales emparejado con envíos de red); sin sandboxing de ejecución para skills en tiempo de ejecución |
| **Riesgo residual**     | Crítico - las skills se ejecutan con privilegios del agente                                                                                              |
| **Recomendaciones**     | Sandboxing de ejecución de skills, aislamiento de credenciales                                                                                           |

---

### 3.8 Impacto (AML.TA0011)

#### T-IMPACT-001: Ejecución de comandos no autorizada

| Atributo                | Valor                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosionar la integridad del modelo de IA                                                 |
| **Descripción**         | El atacante ejecuta comandos arbitrarios en el sistema del usuario                                   |
| **Vector de ataque**    | Inyección de prompt combinada con omisión de aprobación de exec                                      |
| **Componentes afectados** | Herramienta Bash, ejecución de comandos                                                           |
| **Mitigaciones actuales** | Aprobaciones de exec, opción de sandbox de Docker (backend de tiempo de ejecución predeterminado)  |
| **Riesgo residual**     | Crítico - la ejecución en el host es posible cuando el sandbox está deshabilitado                    |
| **Recomendaciones**     | Mejorar la UX de aprobación; los despliegues con sandbox desactivado siguen siendo una elección deliberada del operador, documentada como tal |

#### T-IMPACT-002: Agotamiento de recursos (DoS)

| Atributo                | Valor                                              |
| ----------------------- | -------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosionar la integridad del modelo de IA |
| **Descripción**         | El atacante agota créditos de API o recursos de cómputo |
| **Vector de ataque**    | Inundación automatizada de mensajes, llamadas costosas a herramientas |
| **Componentes afectados** | Gateway, sesiones de agente, proveedor de API    |
| **Mitigaciones actuales** | Ninguna                                           |
| **Riesgo residual**     | Alto - sin limitación de tasa por remitente        |
| **Recomendaciones**     | Límites de tasa por remitente, presupuestos de coste |

#### T-IMPACT-003: Daño reputacional

| Atributo                | Valor                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosionar la integridad del modelo de IA        |
| **Descripción**         | El atacante hace que el agente envíe contenido dañino/ofensivo |
| **Vector de ataque**    | Inyección de prompt que provoca respuestas inapropiadas     |
| **Componentes afectados** | Generación de salida, mensajería de canal                 |
| **Mitigaciones actuales** | Políticas de contenido del proveedor de LLM               |
| **Riesgo residual**     | Medio - los filtros del proveedor son imperfectos           |
| **Recomendaciones**     | Capa de filtrado de salida, controles de usuario            |

---

## 4. Análisis de la cadena de suministro de ClawHub

### 4.1 Controles de seguridad actuales

| Control                        | Implementación                                                                        | Eficacia                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Antigüedad de la cuenta de GitHub | `requireGitHubAccountAge()` (mínimo de 14 días)                                          | Media - eleva la dificultad para nuevos atacantes                           |
| Saneamiento de rutas              | `sanitizePath()`                                                                      | Alta - evita el recorrido de rutas                                      |
| Validación de tipo de archivo           | `isTextFile()`                                                                        | Media - solo se escanean archivos de texto, pero siguen siendo explotables             |
| Límites de tamaño                    | Paquete total de 50 MB (`MAX_PUBLISH_TOTAL_BYTES`)                                         | Alta - evita el agotamiento de recursos                                 |
| SKILL.md obligatorio              | README obligatorio al publicar                                                           | Bajo valor de seguridad - solo informativo                             |
| Escaneo estático + adyacente a AST | Motor de patrones que cubre exec, exfiltración, recolección de credenciales, ofuscación y más | Media-Alta - cubre muchos patrones de abuso conocidos, sigue basado en patrones |
| Revisión agéntica de riesgo basada en LLM  | Veredicto impulsado por prompts de seguridad al publicar                                             | Media-Alta - detecta comportamientos que los patrones estáticos no detectan                 |
| Escaneo con VirusTotal            | Conectado a flujos de publicación/reescan de Skills y lanzamientos de paquetes, condicionado a la clave API del operador    | Alta cuando está habilitado - detección con motor estático                         |
| Estado de moderación              | Campo `moderationStatus`                                                              | Media - revisión manual posible                                     |

### 4.2 Limitaciones de moderación

El escaneo estático de ClawHub inspecciona directamente el contenido del código de Skills (no solo slug/metadatos/frontmatter), y cubre llamadas exec peligrosas, ejecución dinámica de código, recolección de credenciales, patrones de exfiltración, cargas útiles ofuscadas y más. Brechas conocidas:

- La detección basada en patrones todavía puede eludirse con ofuscación lo suficientemente novedosa.
- La revisión basada en LLM y el escaneo con VirusTotal dependen de que las claves API/configuración del lado del operador estén habilitadas.
- Ningún sandbox de ejecución en tiempo de ejecución aísla una Skill de los privilegios propios del agente una vez instalada.

### 4.3 Insignias

Skills y paquetes llevan insignias asignadas por moderadores: `highlighted`, `official`, `deprecated`, `redactionApproved` (solo Skills). Los informes de la comunidad (`skillReports`) y el registro de auditoría (`auditLogs`) respaldan los flujos de trabajo de moderación.

---

## 5. Matriz de riesgos

### 5.1 Probabilidad frente a impacto

| ID de amenaza     | Probabilidad | Impacto   | Nivel de riesgo   | Prioridad |
| ------------- | ---------- | -------- | ------------ | -------- |
| T-EXEC-001    | Alta       | Crítico | **Crítico** | P0       |
| T-PERSIST-001 | Alta       | Crítico | **Crítico** | P0       |
| T-EXFIL-003   | Media     | Crítico | **Crítico** | P0       |
| T-IMPACT-001  | Media     | Crítico | **Alto**     | P1       |
| T-EXEC-002    | Alta       | Alto     | **Alto**     | P1       |
| T-EXEC-004    | Media     | Alto     | **Alto**     | P1       |
| T-ACCESS-003  | Media     | Alto     | **Alto**     | P1       |
| T-EXFIL-001   | Media     | Alto     | **Alto**     | P1       |
| T-IMPACT-002  | Alta       | Medio   | **Alto**     | P1       |
| T-EVADE-001   | Alta       | Medio   | **Medio**   | P2       |
| T-ACCESS-001  | Baja        | Alto     | **Medio**   | P2       |
| T-ACCESS-002  | Baja        | Alto     | **Medio**   | P2       |
| T-PERSIST-002 | Baja        | Alto     | **Medio**   | P2       |

### 5.2 Cadenas de ataque de ruta crítica

**Cadena 1: Robo de datos basado en Skills**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Cadena 2: Inyección de prompts a RCE**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Cadena 3: Inyección indirecta mediante contenido recuperado**

```text
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Resumen de recomendaciones

### 6.1 Inmediato (P0)

| ID    | Recomendación                              | Aborda                  |
| ----- | ------------------------------------------- | -------------------------- |
| R-002 | Implementar sandboxing de ejecución de Skills        | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Añadir validación de salida para acciones sensibles | T-EXEC-001, T-EXEC-002     |

### 6.2 Corto plazo (P1)

| ID    | Recomendación                                                        | Aborda    |
| ----- | --------------------------------------------------------------------- | ------------ |
| R-004 | Implementar limitación de tasa por remitente                                    | T-IMPACT-002 |
| R-005 | Añadir cifrado de tokens en reposo                                          | T-ACCESS-003 |
| R-006 | Mejorar la UX de aprobación de exec y seguir ampliando la normalización de comandos | T-EXEC-004   |
| R-007 | Implementar lista de permitidos de URL para `web_fetch`                            | T-EXFIL-001  |

### 6.3 Medio plazo (P2)

| ID    | Recomendación                                        | Aborda     |
| ----- | ----------------------------------------------------- | ------------- |
| R-008 | Añadir verificación criptográfica de canales donde sea posible | T-ACCESS-002  |
| R-009 | Implementar verificación de integridad de configuración               | T-PERSIST-003 |
| R-010 | Añadir firma de actualizaciones y fijación de versiones                | T-PERSIST-002 |

---

## 7. Apéndices

### 7.1 Mapeo de técnicas ATLAS

| ID de ATLAS      | Nombre de la técnica                 | Amenazas de OpenClaw                                                 |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Escaneo activo                | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Recopilación                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Cadena de suministro: software de IA      | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Cadena de suministro: datos             | T-PERSIST-003                                                    |
| AML.T0031     | Erosionar la integridad del modelo de IA       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Acceso a la API de inferencia del modelo de IA  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Crear datos adversarios         | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Inyección de prompts en LLM: directa   | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Inyección de prompts en LLM: indirecta | T-EXEC-002                                                       |

### 7.2 Archivos de seguridad clave

| Ruta                                | Propósito                        | Nivel de riesgo   |
| ----------------------------------- | ------------------------------ | ------------ |
| `src/infra/exec-approvals.ts`       | Lógica de aprobación de comandos         | **Crítico** |
| `src/gateway/auth.ts`               | Autenticación de Gateway         | **Crítico** |
| `src/infra/net/ssrf.ts`             | Protección contra SSRF                | **Crítico** |
| `src/security/external-content.ts`  | Mitigación de inyección de prompts    | **Crítico** |
| `src/agents/sandbox/tool-policy.ts` | Política de permitir/denegar herramientas del sandbox | **Crítico** |
| `src/routing/resolve-route.ts`      | Aislamiento/enrutamiento de sesiones    | **Medio**   |

### 7.3 Glosario

| Término                 | Definición                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Panorama de amenazas adversarias para sistemas de IA de MITRE       |
| **ClawHub**          | Marketplace de Skills de OpenClaw                              |
| **Gateway**          | Capa de enrutamiento de mensajes y autenticación de OpenClaw       |
| **MCP**              | Model Context Protocol - interfaz de proveedor de herramientas          |
| **Inyección de prompts** | Ataque en el que se incrustan instrucciones maliciosas en la entrada |
| **Skill**            | Extensión descargable para agentes de OpenClaw                |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Este modelo de amenazas es un documento vivo. Informa problemas de seguridad a `security@openclaw.ai` o consulta la [página de confianza](https://trust.openclaw.ai)._

## Relacionado

- [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL)
- [Respuesta a incidentes](/es/security/incident-response)
- [Proxy de red](/es/security/network-proxy)
- [Verificación formal](/es/security/formal-verification)
