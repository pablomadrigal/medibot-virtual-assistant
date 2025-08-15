

# **Diseño y Orquestación de Agentes de IA Secuenciales: Un Modelo Arquitectónico para la Gestión Avanzada del Contexto Clínico**

## **Sección 1: Deconstruyendo el "Perfil de Contexto": Del Concepto Ambiguo al Primitivo Arquitectónico**

El desarrollo de sistemas de inteligencia artificial (IA) cada vez más sofisticados, especialmente en dominios de alto riesgo como la medicina, exige una precisión terminológica y un rigor arquitectónico que trascienden las nociones populares. El término "perfil de contexto" ha ganado tracción en diversos círculos, pero su definición laxa requiere una formalización para ser útil en el diseño de sistemas de agentes robustos y escalables. Esta sección establecerá una base conceptual sólida, transformando la idea de un "perfil de contexto" en un componente arquitectónico central y bien definido: el **Objeto de Estado del Flujo de Trabajo (WSO, por sus siglas en inglés, Workflow State Object)**.

### **1.1 La Ambigüedad del "Perfil de Contexto": De las Redes Sociales al Diseño de Sistemas**

El uso informal del término "perfil de contexto" se ha popularizado en plataformas como TikTok, donde se describe como un objeto JSON generado a partir de una imagen para guiar la creación de imágenes posteriores por parte de una IA.1 En este escenario, un usuario carga una imagen de inspiración y solicita un "perfil de contexto JSON avanzado". El código resultante encapsula características estilísticas, de color y de composición que la IA utiliza para generar nuevas imágenes con una precisión asombrosa. Los usuarios pueden incluso editar este JSON para personalizar los resultados.2

Si bien este uso ilustra el principio fundamental de emplear datos estructurados para mantener la coherencia y guiar a un modelo de IA, representa una forma de contexto que puede clasificarse como un **objeto de contexto estático y de un solo turno**. Es estático porque se genera una vez y no evoluciona dinámicamente en respuesta a un proceso de varios pasos. Es de un solo turno porque su propósito se agota en la siguiente acción de la IA. Este modelo es insuficiente para los sistemas agenticos complejos, como un asistente médico para la creación de expedientes clínicos electrónicos (EHR), que requieren un manejo dinámico del estado a lo largo de un flujo de trabajo secuencial y de múltiples turnos. Es imperativo, por tanto, diferenciar entre estos "trucos" de consumo y los patrones arquitectónicos robustos necesarios para aplicaciones empresariales y críticas.

### **1.2 Estableciendo una Definición Formal: Ingeniería de Contexto y el Protocolo de Contexto del Modelo (MCP)**

Para construir una base sólida, es necesario adoptar una terminología profesional. La disciplina de **Ingeniería de Contexto** se refiere a la gestión deliberada del flujo de información hacia y entre los modelos de IA.3 Se considera una de las partes más desafiantes en la construcción de aplicaciones agenticas, ya que la capacidad de un agente para actuar de manera fiable depende directamente de la calidad y relevancia del contexto que se le proporciona.3

Sobre esta disciplina se erige el **Protocolo de Contexto del Modelo (MCP, por sus siglas en inglés, Model Context Protocol)**, un enfoque más estructurado que busca estandarizar la gestión del contexto.5 El MCP propone un marco conceptual para separar distintos tipos de contexto, lo cual es fundamental para evitar que los agentes se vean abrumados por la información o pierdan el hilo en tareas complejas, un fenómeno conocido como el "problema de los modelos desconectados".6

Sintetizando estos conceptos, se define formalmente el componente central de nuestra arquitectura: el **Objeto de Estado del Flujo de Trabajo (WSO)**. El WSO es un objeto de datos dinámico, estructurado y versionado (típicamente en formato JSON) que actúa como la única fuente de verdad para una tarea específica mientras esta atraviesa el sistema multiagente. A diferencia de un perfil estático, el WSO es un objeto vivo que acumula información, registra decisiones y mantiene el estado completo de un flujo de trabajo de principio a fin.

### **1.3 La Anatomía del Contexto: Un Enfoque Multicapa**

Un diseño eficaz del WSO requiere una disección de las distintas capas de contexto que deben gestionarse, basándose en los principios del MCP y de los Sistemas Conscientes del Contexto (CAS).5 Esta separación jerárquica es clave para la modularidad y la escalabilidad.

* **Contexto de Usuario:** Información estable sobre el usuario principal del sistema. En el caso de un agente de EHR, esto incluiría la identificación del médico, su especialidad, preferencias de documentación y otros datos semipermanentes.5  
* **Contexto de Sesión/Tarea:** Información volátil y específica de la instancia actual del flujo de trabajo. Esto abarca la identificación del paciente, la fecha y hora del encuentro clínico, el objetivo principal de la interacción (p. ej., "consulta inicial", "seguimiento") y cualquier estado temporal.5 Esta capa constituye el núcleo dinámico del WSO.  
* **Contexto de Entorno:** Información a nivel de sistema, como la plataforma desde la que se accede (p. ej., aplicación de escritorio, dispositivo móvil), el dispositivo específico, la ubicación y los tokens de seguridad o permisos relevantes para la sesión.5  
* **Contexto de Memoria:** Conocimiento a largo plazo que se recupera dinámicamente según sea necesario. Esto incluye fragmentos relevantes del historial médico pasado del paciente, directrices clínicas pertinentes extraídas de una base de conocimientos, o resúmenes de interacciones previas.3  
* **Contexto de Agente/Perfil:** Reglas de configuración o directrices específicas para el rol de un agente o los estándares del proyecto. Un ejemplo práctico es el uso de perfiles en Amazon Q, donde se pueden definir diferentes contextos para proyectos en Python, Java o Terraform, cada uno con sus propias guías de codificación y mejores prácticas.9 Esto permite que los agentes se comporten de manera contextualmente apropiada y reutilizable.

### **1.4 El WSO en un Flujo de Trabajo Secuencial**

Aplicando esta definición formal al problema planteado, el WSO es el objeto que se crea en el primer paso del proceso. Por ejemplo, el Agente 1 (un transcriptor) recibe una entrada inicial del usuario (una grabación de audio) y crea la versión inicial del WSO. Este objeto se pasa al Agente 2 (un extractor de datos), que lo *aumenta* con su propio resultado y con cualquier nueva entrada del usuario (como una corrección del médico). Este WSO aumentado se transfiere luego al Agente 3, y así sucesivamente.

Este mecanismo de acumulación asegura que cada agente en la secuencia tenga acceso no solo a la salida del agente inmediatamente anterior, sino al historial completo de la tarea hasta ese momento. Esto crea una "pista de auditoría digital" completa y trazable de todo el proceso, encapsulada en un único objeto de estado coherente.10 Los marcos de trabajo modernos como FlowiseAI y LangGraph modelan explícitamente este comportamiento a través de un objeto de

state compartido que persiste a lo largo de un grafo de flujo de trabajo.3

Una consecuencia fundamental de esta conceptualización es el cambio de mentalidad para el desarrollador: el desafío no es "crear un archivo JSON", sino "gestionar un objeto de estado" que evoluciona a lo largo del ciclo de vida del flujo de trabajo. Esta perspectiva tiene profundas implicaciones arquitectónicas, favoreciendo los marcos de orquestación con estado (stateful) sobre las cadenas de llamadas a API simples y sin estado (stateless). La separación jerárquica del contexto dentro del esquema del WSO permite además una mayor eficiencia; el "Contexto de Usuario" rara vez cambia, mientras que el "Contexto de Sesión" es altamente volátil. Separarlos permite actualizaciones parciales, reduce la redundancia de datos y facilita la depuración y el mantenimiento del sistema, aplicando principios sólidos de ingeniería de software al desarrollo de IA.

| Paradigma | Concepto Central | Formato Típico | Características Clave | Relevancia para el Agente Médico |
| :---- | :---- | :---- | :---- | :---- |
| **"Perfil de Contexto" Informal** | Objeto estático para guiar una única acción de IA. | JSON | Estático, de un solo turno, generado a partir de una entrada inicial. | Bajo. Insuficiente para procesos dinámicos y secuenciales. Sirve como una analogía básica. |
| **Perfiles de AWS Q** | Conjunto de archivos de configuración para adaptar el comportamiento de la IA a un proyecto o rol. | Archivos Markdown, etc. | Específico del espacio de trabajo, conmutable, define reglas y estándares. | Medio. Útil para definir el "Contexto de Agente" (p. ej., reglas de documentación para cardiología vs. pediatría). |
| **Protocolo de Contexto del Modelo (MCP)** | Marco conceptual para estandarizar la gestión y separación del contexto. | Pseudo-código, interfaces | Separa el contexto en capas (Usuario, Sesión, etc.), dinámico, enfocado en la robustez. | Alto. Proporciona la base teórica para un diseño de contexto modular y escalable. |
| **Ingeniería de Contexto** | La disciplina de seleccionar, estructurar y secuenciar la información para los agentes. | Prompts, objetos de estado | Práctica, enfocada en la fiabilidad, incluye compresión y gestión de memoria. | Muy Alto. Es la práctica de aplicar MCP para construir sistemas fiables. |
| **Objeto de Estado del Flujo de Trabajo (WSO)** | Objeto de datos dinámico y acumulativo que sirve como única fuente de verdad para una tarea. | JSON con esquema forzado | Dinámico, de múltiples turnos, versionado, auditable, centralizado. | Crítico. Es la implementación concreta y arquitectónica de los principios de MCP y la Ingeniería de Contexto para el caso de uso del usuario. |

## **Sección 2: Arquitectura de Flujos de Trabajo Secuenciales Multiagente para Documentación Clínica**

Una vez definido el Objeto de Estado del Flujo de Trabajo (WSO) como la carga útil central, el siguiente paso es diseñar la arquitectura que orquesta su viaje a través de un sistema multiagente. Para una tarea secuencial como la creación de un expediente clínico, donde cada paso se basa en el anterior, la arquitectura debe garantizar una transferencia de estado fiable, una ejecución ordenada y la capacidad de gestionar errores y dependencias.

### **2.1 Patrón Arquitectónico Central: El Modelo Orquestador-Trabajador**

El patrón predominante para los sistemas multiagente, y el más adecuado para este caso de uso, es el modelo **Orquestador-Trabajador** (también conocido como Supervisor-Trabajador o Maestro-Esclavo).4 En esta arquitectura, un agente central, el Orquestador, coordina un equipo de agentes trabajadores, cada uno especializado en una subtarea específica. Para el flujo de trabajo secuencial descrito, la orquestación es lineal, pero el patrón proporciona la estructura para una lógica más compleja si es necesario.

Las responsabilidades principales del Orquestador son:

1. **Descomposición de Tareas:** El Orquestador recibe el objetivo principal (p. ej., "generar la nota del EHR para el encuentro del paciente X") y lo descompone en una secuencia lógica de subtareas que serán asignadas a los agentes trabajadores.11 Por ejemplo: 1\) Transcribir audio, 2\) Extraer entidades clínicas, 3\) Generar resumen.  
2. **Gestión del Estado:** Es responsable de inicializar el WSO al comienzo del flujo de trabajo y de asegurar su integridad y consistencia a medida que se pasa de un trabajador a otro.  
3. **Invocación de Agentes:** Llama al agente trabajador correcto en cada paso de la secuencia, pasándole la versión más reciente del WSO como entrada.  
4. **Gestión de Errores y Bucles:** Si un agente trabajador falla, el Orquestador debe manejar el error. Esto puede implicar reintentar la tarea, pasar a un flujo de recuperación de errores o notificar a un supervisor humano. También puede gestionar bucles, por ejemplo, si la salida de un agente no cumple con un umbral de calidad, puede devolver el WSO al mismo agente para un refinamiento iterativo, una capacidad soportada por marcos como FlowiseAI.10

Un ejemplo directamente relevante del dominio médico es la arquitectura de Akira AI, que emplea un "Agente Orquestador Maestro" como unidad de control central para dirigir a otros agentes (como el Agente de Entrada de Datos y el Agente de Soporte a la Decisión), asegurando que las tareas se realicen en el orden correcto y se cumplan los protocolos sanitarios.14

### **2.2 De la Teoría a la Práctica: Ejecución Basada en Grafos con LangGraph y FlowiseAI**

La implementación moderna de la orquestación de agentes se basa en una abstracción poderosa: el **grafo con estado (stateful graph)**.3 En lugar de una simple cadena de llamadas a API, que es frágil y difícil de gestionar, un grafo representa el flujo de trabajo como una red de nodos y aristas, proporcionando una estructura mucho más robusta y flexible.

* **LangGraph:** Este marco de LangChain trata los flujos de trabajo como un StateGraph. Cada agente o función es un nodo en el grafo. Las aristas definen la secuencia de ejecución, determinando qué nodo se ejecuta a continuación. El WSO corresponde directamente al objeto State que se pasa entre los nodos. Este estado es explícitamente gestionado y puede ser persistido usando un MemorySaver, lo que permite la reanudación de flujos de trabajo y la auditoría.15 LangChain enfatiza que dar al desarrollador "control total" sobre el contexto es crítico para construir aplicaciones fiables, y LangGraph es la herramienta diseñada para este fin.3  
* **FlowiseAI:** De manera similar, los Agentes Secuenciales de FlowiseAI utilizan un **grafo dirigido cíclico (DCG)** donde el objeto state es la estructura de datos compartida que fluye a través de los nodos.10 Su interfaz visual hace que el concepto de nodos (Nodo Agente, Nodo LLM, Nodo Condición) y el flujo de estado sean particularmente intuitivos.

El uso de una arquitectura basada en grafos resuelve inherentemente el "problema de los modelos desconectados", donde los agentes pierden el contexto entre interacciones.6 El grafo asegura que el WSO, el portador del contexto, se mantenga y se propague correctamente. Además, un modelo de grafo permite una lógica de flujo de trabajo mucho más rica que una simple secuencia. Se pueden implementar fácilmente bifurcaciones condicionales ("si la confianza de la extracción es inferior al 90%, dirigir a un nodo de revisión humana") y bucles ("si el resumen generado es rechazado por el médico, volver al nodo de composición con la retroalimentación"). Esta capacidad de modelar flujos de trabajo complejos y realistas es indispensable para una aplicación médica, donde la rigidez de una cadena lineal sería un punto de fallo inaceptable.

### **2.3 El Flujo de Información Secuencial: Un Rastreo Paso a Paso**

Para ilustrar de manera concreta cómo el WSO facilita el flujo de información acumulativo, se puede trazar su viaje a través de una cadena hipotética de tres agentes médicos:

* **Inicio:** El Orquestador recibe una solicitud para documentar un nuevo encuentro. Crea el **WSO v1.0**, que contiene workflow\_id, patient\_id, clinician\_id y la entrada inicial (p. ej., la ubicación de un archivo de audio de la consulta).  
* **Paso 1 (Agente A \- El Transcriptor):**  
  * **Recibe:** WSO v1.0.  
  * **Acción:** Procesa el archivo de audio y genera una transcripción de texto.  
  * **Salida:** *Añade* su resultado al WSO. El nuevo **WSO v2.0** ahora contiene toda la información de v1.0 más un nuevo campo, por ejemplo, agent\_outputs.transcription.text.  
* **Paso 2 (Agente B \- El Extractor Clínico):**  
  * **Recibe:** WSO v2.0 y, potencialmente, una nueva entrada del usuario (p. ej., el médico introduce una nota de texto con una corrección: "El diagnóstico es migraña crónica, no cefalea tensional").  
  * **Acción:** Utiliza la transcripción (agent\_outputs.transcription.text) y la corrección del médico para extraer entidades estructuradas (diagnósticos, medicamentos, síntomas).  
  * **Salida:** *Añade* sus hallazgos al WSO. El **WSO v3.0** ahora contiene todo lo anterior más agent\_outputs.extractor.structured\_findings (un objeto JSON con los datos extraídos) y un registro de la entrada del médico.  
* **Paso 3 (Agente C \- El Compositor de Notas):**  
  * **Recibe:** WSO v3.0.  
  * **Acción:** Utiliza *todo el contenido* del WSO (la transcripción original, los datos estructurados extraídos, etc.) para generar un borrador de la nota clínica en formato SOAP (Subjetivo, Objetivo, Apreciación, Plan).  
  * **Salida:** El **WSO v4.0** final contiene el historial completo del proceso y el borrador de la nota en final\_outputs.ehr\_note\_draft.

Este rastreo demuestra explícitamente cómo el segundo agente utiliza los datos del primero más la entrada del usuario, y el tercero utiliza los datos de los dos anteriores. La clave no es pasar fragmentos de información desordenados en un prompt, sino pasar un único objeto de estado, estructurado y acumulativo, que sirve como un registro completo y coherente de la tarea. La elección de un marco de orquestación de bajo nivel como LangGraph se convierte en una decisión arquitectónica crítica en este contexto, ya que proporciona el control granular necesario para gestionar meticulosamente el WSO, integrar lógica personalizada y garantizar la fiabilidad requerida en un dominio regulado como la sanidad.

## **Sección 3: La Anatomía de un Objeto de Estado del Flujo de Trabajo: Mejores Prácticas para el Diseño de Esquemas JSON**

El diseño del Objeto de Estado del Flujo de Trabajo (WSO) es el corazón técnico de un sistema de agentes secuenciales. Un esquema bien diseñado no solo garantiza una comunicación fiable entre agentes, sino que también facilita la depuración, la auditoría y la extensibilidad futura del sistema. Esta sección proporciona directrices concretas para estructurar el WSO utilizando esquemas JSON, asegurando que sea robusto, escalable y auto-documentado.

### **3.1 El "Porqué": Forzar la Estructura con Esquemas JSON**

Simplemente *solicitar* a un Modelo de Lenguaje Grande (LLM) que genere una salida en formato JSON es una práctica insuficiente y propensa a errores. Los modelos pueden omitir campos, inventar valores no válidos o generar JSON malformado, lo que provocaría el fallo de todo el flujo de trabajo en cadena. El estado del arte no es solicitar, sino *forzar* un esquema.

El mecanismo principal para lograr esto es la funcionalidad de **Salidas Estructuradas (Structured Outputs)** ofrecida por proveedores como OpenAI.17 Esta característica garantiza que la respuesta del modelo se ajustará siempre a un Esquema JSON (JSON Schema) proporcionado por el desarrollador. Esto elimina la necesidad de implementar lógica de validación y reintentos para las salidas del modelo, lo que supone una ganancia masiva en fiabilidad y simplicidad del código.17 Cuando un agente en una secuencia depende de la salida del anterior, esta garantía se convierte en un requisito no negociable.

Además, el uso de bibliotecas como **Pydantic** en Python o **Zod** en JavaScript permite definir estos esquemas directamente en el código de la aplicación.17 Esto eleva los esquemas a la categoría de ciudadanos de primera clase en la base del código, facilitando su reutilización, versionado y mantenimiento junto con el resto de la lógica de la aplicación.

### **3.2 Principios de un Esquema de WSO Robusto**

Un esquema de WSO eficaz debe adherirse a principios de diseño de software probados, adaptados a las necesidades de los sistemas de IA.

* **Modularidad y Jerarquía:** Agrupar los campos relacionados bajo claves principales lógicas (p. ej., patient\_info, current\_encounter, agent\_outputs). Esto evita una estructura plana y desorganizada que se vuelve inmanejable a medida que el sistema crece. La jerarquía hace que el objeto sea más legible tanto para humanos como para máquinas.  
* **Extensibilidad:** El esquema debe diseñarse para que se puedan añadir nuevos agentes o tipos de datos en el futuro sin romper los componentes existentes. El uso de estructuras flexibles, como un array de objetos para agent\_outputs, donde cada agente añade su propio objeto de resultado, es una estrategia clave para lograrlo.  
* **Versionado:** Incluir un campo schema\_version en la raíz del objeto es fundamental. A medida que el sistema evoluciona, el esquema del WSO inevitablemente cambiará. El versionado explícito es crítico para gestionar la retrocompatibilidad y permitir actualizaciones graduales del sistema sin interrumpir el servicio.18  
* **Claridad y Autodocumentación:** Utilizar nombres de clave claros e inequívocos (p. ej., patient\_id en lugar de pid). Aprovechar el estándar JSON Schema para incluir un campo description para cada propiedad, documentando su propósito, formato esperado y origen. Esto hace que el WSO sea comprensible por sí mismo, reduciendo la carga cognitiva para los desarrolladores que trabajan en el sistema.  
* **Compacidad:** Aunque la claridad es primordial, se debe evitar la verbosidad excesiva para gestionar eficientemente los costes de tokens, especialmente cuando el WSO se pasa completo o en parte al contexto de un LLM. Por ejemplo, se puede usar bbox en lugar de bounding\_box si el contexto es claro y está bien documentado.19

### **3.3 Una Plantilla de Esquema JSON Propuesta para el Agente de EHR Médico**

A continuación se presenta una plantilla de Esquema JSON detallada y anotada para el WSO de un agente de EHR. Este es el artefacto central y accionable de esta sección, diseñado para ser tanto funcional como un ejemplo de las mejores prácticas.

**Objeto Raíz:**

* workflow\_id: (string, formato UUID) Un identificador único para toda la ejecución de esta tarea. Esencial para el registro y la auditoría.  
* schema\_version: (string, p. ej., "1.0.0") Versión del esquema del WSO utilizado.  
* patient\_id: (string) Identificador único del paciente, obtenido del sistema de registros médicos.  
* clinician\_id: (string) Identificador único del profesional clínico que inicia el flujo de trabajo.  
* encounter\_details: (object) Un objeto que contiene metadatos sobre el encuentro clínico actual.  
* workflow\_inputs: (array) Un registro de auditoría de todas las entradas recibidas durante el flujo de trabajo.  
* agent\_outputs: (object) Un contenedor donde cada agente del flujo de trabajo escribe su salida.  
* final\_summary: (object) El resultado final consolidado, listo para ser presentado.  
* validation: (object) Un bloque para registrar la validación humana del resultado.

JSON

{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "Workflow State Object (WSO) for Medical EHR Agent",  
  "description": "A dynamic object that tracks the state of an EHR documentation workflow.",  
  "type": "object",  
  "properties": {  
    "workflow\_id": {  
      "type": "string",  
      "format": "uuid",  
      "description": "Unique identifier for this entire workflow instance."  
    },  
    "schema\_version": {  
      "type": "string",  
      "pattern": "^\\\\d+\\\\.\\\\d+\\\\.\\\\d+$",  
      "description": "Semantic version of this WSO schema."  
    },  
    "patient\_id": {  
      "type": "string",  
      "description": "The unique identifier for the patient."  
    },  
    "clinician\_id": {  
      "type": "string",  
      "description": "The unique identifier for the clinician."  
    },  
    "encounter\_details": {  
      "type": "object",  
      "properties": {  
        "encounter\_id": { "type": "string", "format": "uuid" },  
        "encounter\_timestamp": { "type": "string", "format": "date-time" },  
        "status": {  
          "type": "string",  
          "enum": \["in\_progress", "pending\_review", "completed", "error"\],  
          "description": "The current status of the workflow."  
        }  
      },  
      "required": \["encounter\_id", "encounter\_timestamp", "status"\]  
    },  
    "workflow\_inputs": {  
      "type": "array",  
      "description": "An audit trail of all inputs received during the workflow.",  
      "items": {  
        "type": "object",  
        "properties": {  
          "source": { "type": "string", "description": "Origin of the input (e.g., 'clinician', 'agent\_1')." },  
          "type": { "type": "string", "description": "Type of input (e.g., 'audio\_stream\_uri', 'text\_correction')." },  
          "content": {},  
          "timestamp": { "type": "string", "format": "date-time" }  
        },  
        "required": \["source", "type", "content", "timestamp"\]  
      }  
    },  
    "agent\_outputs": {  
      "type": "object",  
      "description": "A container for the outputs of each agent, namespaced by agent ID.",  
      "properties": {  
        "scribe\_agent": {  
          "type": "object",  
          "properties": {  
            "raw\_transcript": { "type": "string" },  
            "confidence": { "type": "number", "minimum": 0, "maximum": 1 },  
            "timestamp": { "type": "string", "format": "date-time" }  
          }  
        },  
        "extractor\_agent": {  
          "type": "object",  
          "properties": {  
            "structured\_data": {  
              "type": "object",  
              "properties": {  
                "symptoms": { "type": "array", "items": { "type": "string" } },  
                "diagnoses": { "type": "array", "items": { "type": "string" } },  
                "medications": { "type": "array", "items": { "type": "object" } }  
              }  
            },  
            "retrieved\_context": { "type": "array", "items": { "type": "string" } },  
            "alerts": { "type": "array", "items": { "type": "string" } },  
            "timestamp": { "type": "string", "format": "date-time" }  
          }  
        }  
      }  
    },  
    "final\_summary": {  
      "type": "object",  
      "properties": {  
        "ehr\_note\_draft": { "type": "string" },  
        "patient\_summary": { "type": "string" },  
        "suggested\_billing\_codes": { "type": "array", "items": { "type": "string" } }  
      }  
    },  
    "validation": {  
      "type": "object",  
      "properties": {  
        "status": {  
          "type": "string",  
          "enum": \["unvalidated", "validated\_by\_clinician", "rejected"\],  
          "default": "unvalidated"  
        },  
        "validator\_id": { "type": "string" },  
        "validation\_notes": { "type": "string" },  
        "timestamp": { "type": "string", "format": "date-time" }  
      }  
    }  
  },  
  "required": \["workflow\_id", "schema\_version", "patient\_id", "clinician\_id", "encounter\_details"\]  
}

El diseño de este esquema no es solo un ejercicio técnico; es una decisión estratégica. Un sistema que maneja registros de salud electrónicos estará sujeto a una intensa escrutinio y regulación.20 En caso de error, un humano debe poder depurar el sistema de manera inequívoca. Un WSO bien estructurado, con claves claras, marcas de tiempo, salidas espaciadas por nombres y un rastro de auditoría de entradas, sirve como un registro completo y legible por humanos del "proceso de pensamiento" del agente.4 Esto transforma el WSO de un mero objeto de paso de datos a un activo crítico para la transparencia, la depuración y el cumplimiento normativo.

| Ruta de la Clave | Tipo de Dato | Descripción | Ejemplo de Valor |
| :---- | :---- | :---- | :---- |
| workflow\_id | string (uuid) | Identificador único para toda la ejecución de la tarea. | "a1b2c3d4-..." |
| schema\_version | string | Versión semántica del esquema del WSO. | "1.0.0" |
| encounter\_details.status | enum | Estado actual del flujo de trabajo. | "pending\_review" |
| workflow\_inputs.source | string | Origen de una entrada específica. | "clinician" |
| agent\_outputs.scribe\_agent.raw\_transcript | string | La transcripción de texto generada por el agente escriba. | "El paciente refiere dolor de cabeza..." |
| agent\_outputs.extractor\_agent.structured\_data | object | Datos clínicos estructurados extraídos de la transcripción. | {"diagnoses": \["Migraña crónica"\]} |
| validation.status | enum | El estado de la validación por parte del profesional clínico. | "validated\_by\_clinician" |

## **Sección 4: Un Modelo de Memoria Híbrido: Integrando el WSO con el Conocimiento Persistente**

Si bien el Objeto de Estado del Flujo de Trabajo (WSO) gestiona eficazmente el contexto de una sola tarea en curso, su alcance es inherentemente limitado. Un sistema de IA para EHR no puede ser amnésico entre sesiones; debe tener acceso al historial completo del paciente y a un cuerpo más amplio de conocimiento médico. Esta sección avanza la arquitectura propuesta al situar el WSO (memoria de trabajo) dentro de un sistema de memoria híbrido más potente que incluye almacenamiento a largo plazo y persistente.

### **4.1 Los Límites de la Memoria de Trabajo: Por Qué el WSO no es Suficiente**

El WSO es la **memoria de trabajo** (o memoria a corto plazo) del sistema de agentes. Es efímero, de alta velocidad y específico para la tarea actual.15 Contiene el "aquí y ahora" de la interacción. Sin embargo, para realizar tareas clínicas significativas, el sistema necesita una

**memoria persistente** (o memoria a largo plazo).11 Esta memoria es duradera, consultable y compartida entre todas las tareas y sesiones. Es donde reside el expediente completo del paciente, las directrices clínicas y el conocimiento acumulado de la organización.

La distinción entre estos dos tipos de memoria, inspirada en las analogías de la ciencia cognitiva utilizadas en la literatura sobre IA, es una piedra angular arquitectónica 22:

* **Memoria de Trabajo (WSO):** Gestiona el estado de la conversación activa y el flujo de trabajo. Almacena información temporal como la transcripción actual, las entidades extraídas para esta sesión y las entradas del usuario en tiempo real. Su propósito es garantizar la continuidad dentro de una única tarea.  
* **Memoria Persistente:** Almacena el conocimiento a largo plazo. Contiene el historial médico completo del paciente, preferencias, interacciones pasadas y una base de conocimientos de literatura médica. Su propósito es proporcionar un contexto profundo y longitudinal que informe a todas las tareas.

### **4.2 Arquitectura de la Memoria Persistente: La Herramienta Adecuada para los Datos Adecuados**

Un enfoque de "talla única" para la base de datos es subóptimo en sistemas complejos. Se propone una arquitectura de **persistencia políglota**, un patrón común en la ingeniería de software moderna, donde diferentes tipos de datos se almacenan en la tecnología de base de datos más adecuada para su estructura y patrones de acceso.

* **Bases de Datos Relacionales (p. ej., PostgreSQL, SQL Server):** Son el estándar de oro para datos altamente estructurados y transaccionales. Este es el almacén canónico para la demografía del paciente, los códigos de facturación (CPT), los códigos de diagnóstico estructurados (ICD-10), los resultados de laboratorio con valores numéricos y las listas de medicamentos.25 Su capacidad para hacer cumplir la integridad referencial y soportar consultas complejas con uniones (joins) es insustituible.  
* **Bases de Datos de Vectores (p. ej., Pinecone, Weaviate, pgvector):** Son esenciales para almacenar y realizar búsquedas semánticas en texto no estructurado o semiestructurado. Aquí es donde se almacenan las notas clínicas históricas, los resúmenes de alta, los artículos de revistas médicas y las transcripciones de conversaciones entre médico y paciente.22 Estas bases de datos convierten el texto en representaciones numéricas (embeddings) y permiten encontrar información contextualmente similar, incluso si las palabras clave no coinciden exactamente. Son la columna vertebral de cualquier sistema de Generación Aumentada por Recuperación (RAG).  
* **Bases de Datos de Documentos (p. ej., MongoDB):** Son una excelente opción para archivar los objetos JSON del WSO una vez que un flujo de trabajo se ha completado. Su esquema flexible se adapta bien a la naturaleza evolutiva de los esquemas JSON, permitiendo almacenar el registro completo de una tarea para auditoría, análisis o reentrenamiento de modelos.15 Aunque algunas bases de datos como DynamoDB pueden tener limitaciones en el tamaño del ítem, lo que puede ser un problema para WSOs complejos, las bases de datos de documentos más flexibles pueden manejar esto con mayor facilidad.

### **4.3 El Bucle de Interacción Híbrido: RAG y Enriquecimiento de Datos**

La verdadera potencia del sistema emerge de la interacción fluida entre la memoria de trabajo (WSO) y la memoria persistente. Este bucle se puede describir en tres pasos clave:

1. **Hidratación (Hydration):** Al comienzo de un nuevo flujo de trabajo (p. ej., un nuevo encuentro con un paciente), el Orquestador consulta los almacenes de memoria persistente. Realiza una consulta SQL a la base de datos relacional para obtener los datos demográficos y los diagnósticos estructurados del paciente, y una consulta semántica a la base de datos de vectores para recuperar un resumen de las notas clínicas más recientes. Esta información se utiliza para "hidratar" o pre-poblar el WSO inicial, proporcionando a los agentes un contexto de partida rico desde el primer momento.  
2. **Enriquecimiento mediante RAG (Retrieval-Augmented Generation):** Durante el flujo de trabajo, los agentes pueden utilizar la información que se va acumulando en el WSO para formular nuevas consultas a la memoria persistente. Por ejemplo, si el Agente Extractor identifica un diagnóstico provisional de "fibrilación auricular" en la transcripción, puede usar este término para lanzar una consulta a la base de datos de vectores para:  
   * Recuperar las directrices de tratamiento más recientes para esa condición desde la base de conocimientos médicos.  
   * Buscar en el historial del paciente menciones previas de arritmias o medicamentos anticoagulantes.  
     Este proceso es la Generación Aumentada por Recuperación (RAG), un patrón arquitectónico crítico para fundamentar las salidas del LLM en datos factuales y verificables, reduciendo drásticamente el riesgo de "alucinaciones".30 La información recuperada se añade entonces al WSO, enriqueciendo aún más el contexto de trabajo del siguiente agente. Investigaciones como el pipeline CLEAR demuestran que una estrategia de recuperación sofisticada, basada en entidades, es más eficiente y precisa que la fragmentación ingenua de documentos.32  
3. **Persistencia (Persistence):** Una vez que el flujo de trabajo ha concluido y ha sido validado por el profesional clínico, el Orquestador es responsable de escribir la información relevante del WSO final de vuelta a los almacenes de memoria persistente. Los nuevos diagnósticos y medicamentos estructurados se insertan en la base de datos SQL. La nueva nota clínica generada se convierte en un embedding y se almacena en la base de datos de vectores para que esté disponible en futuras consultas RAG. El objeto WSO completo puede ser archivado en la base de datos de documentos para su registro.

Esta arquitectura híbrida es la clave para pasar de un simple chatbot a un verdadero "asistente digital experto". El WSO no es una isla; es un puente hacia un vasto océano de conocimiento persistente. La capacidad del sistema para tirar dinámicamente de la memoria a largo plazo y llevarla a su contexto de trabajo (el WSO) a través de RAG es lo que le confiere una profunda comprensión del dominio y del paciente. La seguridad clínica exige este enfoque; en un entorno médico, una alucinación del LLM puede tener consecuencias catastróficas. RAG es el principal patrón arquitectónico para mitigar este riesgo, obligando al agente a basar su razonamiento en la realidad del expediente del paciente y en la literatura médica aprobada.

| Tipo de Dato | Descripción | Tecnología de Almacenamiento Primaria | Rol en el Flujo de Trabajo |
| :---- | :---- | :---- | :---- |
| **Demografía del Paciente** | Datos estructurados como nombre, fecha de nacimiento, etc. | Base de Datos Relacional (SQL) | Hidratación inicial del WSO. |
| **Resultados de Laboratorio** | Valores numéricos y fechas estructurados. | Base de Datos Relacional (SQL) | Hidratación y enriquecimiento (p. ej., para comprobar valores anormales). |
| **Conversación Actual** | Texto no estructurado de la transcripción en tiempo real. | Memoria de Trabajo (WSO) | Entrada principal para los agentes de extracción y síntesis. |
| **Notas Clínicas Históricas** | Texto no estructurado de encuentros pasados. | Base de Datos de Vectores | Enriquecimiento mediante RAG para proporcionar contexto longitudinal. |
| **Literatura Médica** | Artículos, directrices, etc. (texto no estructurado). | Base de Datos de Vectores | Enriquecimiento mediante RAG para fundamentar las decisiones en evidencia. |
| **Estado del Flujo de Trabajo** | El objeto WSO completo y sus versiones. | Base de Datos de Documentos | Archivo y auditoría al final del flujo de trabajo. |

## **Sección 5: Plan de Aplicación: Un Sistema Multiagente Secuencial para la Generación de EHR**

Esta sección final sintetiza todos los conceptos arquitectónicos discutidos previamente en un plan de aplicación tangible y detallado. Se describe un sistema multiagente secuencial diseñado específicamente para el caso de uso de la generación de expedientes clínicos electrónicos (EHR), ilustrando cómo el WSO, la arquitectura de orquestación y el modelo de memoria híbrido se unen para crear una solución funcional y robusta.

### **5.1 Definiendo el Equipo de Agentes y el Flujo de Trabajo**

Un enfoque exitoso para una tarea compleja como la documentación clínica no reside en un único modelo monolítico, sino en un equipo colaborativo de agentes especializados.4 Esta división del trabajo permite la modularidad, facilita las pruebas y permite utilizar el modelo más adecuado para cada subtarea. El flujo de trabajo propuesto consta de un Orquestador y un equipo de tres agentes trabajadores, inspirados en los casos de uso del mundo real descritos en la investigación.14

* **Agente 1: Escriba Ambiental y de Admisión (Ambient Scribe & Intake)**  
  * **Rol:** Este agente es la primera línea de interacción. Utiliza una interfaz de escucha ambiental para capturar la conversación entre el médico y el paciente en tiempo real.21 Su única y principal responsabilidad es producir una transcripción de texto cruda y de alta fidelidad.  
  * **Acción sobre el WSO:** El Orquestador inicia el WSO con metadatos básicos (workflow\_id, patient\_id, clinician\_id). El Agente 1, tras procesar el audio, añade su salida al WSO en la ruta agent\_outputs.scribe.raw\_transcript, junto con una puntuación de confianza y una marca de tiempo.  
* **Agente 2: Extractor y Sintetizador Clínico (Clinical Extractor & Synthesizer)**  
  * **Rol:** Este es el agente más complejo y el núcleo de la inteligencia clínica del sistema. Recibe el WSO con la transcripción y realiza múltiples funciones:  
    1. **Extracción de Información (NLP):** Analiza el texto no estructurado de la transcripción para extraer entidades clínicas estructuradas como diagnósticos, medicamentos, síntomas, procedimientos y resultados de laboratorio mencionados.30  
    2. **Enriquecimiento con RAG:** Utiliza las entidades extraídas para formular consultas contra la memoria persistente. Por ejemplo, si extrae un nuevo medicamento, consultará la base de datos de vectores (que contiene el historial del paciente) para verificar alergias conocidas o interacciones medicamentosas con los fármacos actuales del paciente.  
    3. **Verificación de Consistencia:** Identifica discrepancias entre la información de la conversación actual y el historial conocido del paciente, generando alertas.34 Por ejemplo, si el paciente menciona un síntoma que contradice un diagnóstico establecido.  
  * **Acción sobre el WSO:** Este agente aumenta significativamente el WSO, añadiendo sus hallazgos en agent\_outputs.extractor.structured\_data, el contexto recuperado en agent\_outputs.extractor.retrieved\_context, y cualquier advertencia en agent\_outputs.extractor.potential\_alerts.  
* **Agente 3: Compositor y Resumidor de EHR (EHR Composer & Summarizer)**  
  * **Rol:** Este agente toma el WSO, ahora completamente enriquecido, y genera los documentos clínicos finales en los formatos requeridos.  
  * **Acción sobre el WSO:** Utilizando la transcripción, los datos estructurados, el contexto recuperado y las alertas, genera:  
    * Un borrador de la nota clínica estructurada para el sistema EMR (p. ej., en formato compatible con Epic o Cerner).33  
    * Un resumen en lenguaje sencillo para el paciente (conocido como After-Visit Summary).34  
    * Sugerencias de códigos de facturación relevantes basados en los diagnósticos y procedimientos identificados.33  
  * Estos resultados se añaden a la sección final\_summary del WSO.

### **5.2 El Papel Crítico del Humano en el Bucle (Human-in-the-Loop \- HITL)**

Un sistema totalmente autónomo en el ámbito clínico no es ni factible ni seguro en el estado actual de la tecnología. La arquitectura **debe** incorporar puntos de control de **Humano en el Bucle (HITL)** para garantizar la seguridad del paciente y la responsabilidad profesional.10 El profesional clínico debe seguir siendo la autoridad final.

* **Implementación Arquitectónica:** Después de que el Agente 3 genera los borradores, el Orquestador actualiza el campo status en el WSO a pending\_review. El sistema presenta una interfaz de usuario al médico que muestra la nota generada, la evidencia utilizada para generarla (extraída del WSO, como fragmentos de la transcripción y contexto recuperado por RAG) y cualquier alerta generada por el Agente 2\. El médico puede entonces revisar, editar y, finalmente, aprobar o rechazar la nota.  
* **Cierre del Bucle:** La acción del médico (aprobación/rechazo y cualquier nota adicional) actualiza el bloque de validation en el WSO. Solo después de una aprobación explícita, el Orquestador procede a cometer los datos en el sistema EMR oficial. Este diseño asegura que la IA actúe como un asistente potente y eficiente, pero siempre supervisado, un "copiloto" explicable en lugar de un actor autónomo.

### **5.3 Seguridad, Cumplimiento y Manejo de Datos (HIPAA)**

El manejo de Información de Salud Protegida (PHI) impone requisitos estrictos que deben ser abordados a nivel arquitectónico.

* **Infraestructura Conforme:** Utilizar servicios en la nube que sean elegibles para HIPAA (p. ej., Azure OpenAI, AWS HealthLake, Google Cloud Healthcare API) para todos los componentes que procesan o almacenan PHI.30  
* **Control de Acceso:** El WSO debe contener identificadores (clinician\_id, patient\_id) que se utilizan para aplicar políticas de control de acceso estrictas en cada etapa del flujo de trabajo y en el acceso a la memoria persistente.  
* **Cifrado:** Todos los datos, tanto en tránsito (usando TLS 1.2+ o superior) como en reposo (usando cifrado a nivel de servidor como AWS KMS), deben estar cifrados.  
* **Pistas de Auditoría:** El WSO, una vez archivado, sirve como un registro de auditoría detallado de cada decisión tomada por el sistema de agentes. Todas las interacciones con las bases de datos persistentes también deben registrarse de forma centralizada para el cumplimiento y la investigación de incidentes.4  
* **Anonimización y Desidentificación:** Siempre que sea posible, se deben utilizar técnicas de desidentificación de datos para los pasos de procesamiento que no requieran PHI explícito, minimizando la superficie de exposición de los datos sensibles.

### **Conclusiones y Recomendaciones**

El diseño de un agente de IA para la creación de expedientes médicos es un desafío que se extiende mucho más allá de la simple ingeniería de prompts. Requiere un enfoque arquitectónico disciplinado que transforme el concepto vago de "perfil de contexto" en un artefacto de ingeniería robusto y central: el Objeto de Estado del Flujo de Trabajo (WSO).

La investigación y las mejores prácticas indican que un sistema exitoso en este dominio debe basarse en los siguientes pilares:

1. **Orquestación Basada en Grafos:** Los flujos de trabajo secuenciales deben modelarse como grafos con estado, utilizando marcos como LangGraph, para proporcionar la flexibilidad y robustez necesarias para manejar errores, bucles y la intervención humana.  
2. **Gestión de Estado Explícita:** El WSO debe ser la única fuente de verdad para una tarea en curso. Su diseño, basado en un esquema JSON forzado y versionado, es fundamental para la fiabilidad de la comunicación entre agentes y para la auditabilidad del sistema.  
3. **Arquitectura de Memoria Híbrida:** La verdadera inteligencia del sistema proviene de la interacción entre la memoria de trabajo (el WSO) y una memoria persistente políglota (SQL \+ Vectorial). La Generación Aumentada por Recuperación (RAG) no es una característica opcional, sino un requisito fundamental para la seguridad clínica, ya que fundamenta las respuestas del LLM en datos factuales.  
4. **Diseño Multiagente Especializado:** La tarea debe ser descompuesta y asignada a un equipo de agentes especializados (p. ej., Escriba, Extractor, Compositor). Este enfoque modular es más robusto, comprobable y eficaz que un modelo monolítico.  
5. **Humano en el Bucle como Principio Central:** El producto final del sistema de IA no debe ser un registro EMR definitivo, sino un *borrador propuesto y basado en evidencia* que se presenta al profesional clínico para su validación. Este principio garantiza la seguridad, la responsabilidad y la confianza en el sistema.

Al adoptar estos principios arquitectónicos, es posible diseñar y construir un sistema de agentes de IA que no solo mejore drásticamente la eficiencia de la documentación clínica, reduciendo la carga administrativa sobre los médicos 33, sino que también lo haga de una manera segura, fiable, transparente y conforme a las regulaciones, convirtiéndose en una herramienta valiosa y confiable en el arsenal de la atención médica moderna.

#### **Obras citadas**

1. AI Context Engineering: Key Questions to Ask \- TikTok, fecha de acceso: agosto 6, 2025, [https://www.tiktok.com/@nate.b.jones/video/7518121865790131486](https://www.tiktok.com/@nate.b.jones/video/7518121865790131486)  
2. Understanding JSON Context Profiles for LLMs \- TikTok, fecha de acceso: agosto 6, 2025, [https://www.tiktok.com/@prestonrho/video/7501793212168719662](https://www.tiktok.com/@prestonrho/video/7501793212168719662)  
3. How and when to build multi-agent systems \- LangChain Blog, fecha de acceso: agosto 6, 2025, [https://blog.langchain.com/how-and-when-to-build-multi-agent-systems/](https://blog.langchain.com/how-and-when-to-build-multi-agent-systems/)  
4. Context Engineering for Multi-Agent AI Workflows \- DataOps Labs, fecha de acceso: agosto 6, 2025, [https://blog.dataopslabs.com/context-engineering-for-multi-agent-ai-workflows](https://blog.dataopslabs.com/context-engineering-for-multi-agent-ai-workflows)  
5. Model Context Protocol MCP Implementation for LLMs: A Step-by ..., fecha de acceso: agosto 6, 2025, [https://blog.teoman.me/how-to-implement-model-context-protocol-mcp-in-your-ai-projects/](https://blog.teoman.me/how-to-implement-model-context-protocol-mcp-in-your-ai-projects/)  
6. Advancing Multi-Agent Systems Through Model Context Protocol: Architecture, Implementation, and Applications | by Eleventh Hour Enthusiast \- Medium, fecha de acceso: agosto 6, 2025, [https://medium.com/@EleventhHourEnthusiast/advancing-multi-agent-systems-through-model-context-protocol-architecture-implementation-and-5146564bc1ff](https://medium.com/@EleventhHourEnthusiast/advancing-multi-agent-systems-through-model-context-protocol-architecture-implementation-and-5146564bc1ff)  
7. Challenges in Multi-Agent LLMs: Navigating Coordination and Context Management, fecha de acceso: agosto 6, 2025, [https://gafowler.medium.com/challenges-in-multi-agent-llms-navigating-coordination-and-context-management-20661f9f2bfa](https://gafowler.medium.com/challenges-in-multi-agent-llms-navigating-coordination-and-context-management-20661f9f2bfa)  
8. A Survey on Context-Aware Multi-Agent Systems: Techniques, Challenges and Future Directions \- arXiv, fecha de acceso: agosto 6, 2025, [https://arxiv.org/html/2402.01968v1](https://arxiv.org/html/2402.01968v1)  
9. Context management and profiles \- Amazon Q Developer \- AWS Documentation, fecha de acceso: agosto 6, 2025, [https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-context-profiles.html](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-context-profiles.html)  
10. Sequential Agents | FlowiseAI, fecha de acceso: agosto 6, 2025, [https://docs.flowiseai.com/using-flowise/agentflowv1/sequential-agents](https://docs.flowiseai.com/using-flowise/agentflowv1/sequential-agents)  
11. What are AI Agentic Workflows? \+ Use Cases & Examples \- Budibase, fecha de acceso: agosto 6, 2025, [https://budibase.com/blog/ai-agents/ai-agentic-workflows/](https://budibase.com/blog/ai-agents/ai-agentic-workflows/)  
12. AI Agents Design Patterns Explained | by Kerem Aydın \- Medium, fecha de acceso: agosto 6, 2025, [https://medium.com/@aydinKerem/ai-agents-design-patterns-explained-b3ac0433c915](https://medium.com/@aydinKerem/ai-agents-design-patterns-explained-b3ac0433c915)  
13. How we built our multi-agent research system \- Anthropic, fecha de acceso: agosto 6, 2025, [https://www.anthropic.com/engineering/built-multi-agent-research-system](https://www.anthropic.com/engineering/built-multi-agent-research-system)  
14. How AI Agents Transforming Electronic Medical Records in Healthcare, fecha de acceso: agosto 6, 2025, [https://www.akira.ai/blog/electronic-medical-records-through-ai-agents](https://www.akira.ai/blog/electronic-medical-records-through-ai-agents)  
15. It's Not Magic, It's Memory: How to Architect Short-Term Memory for Agentic AI \- Jit.io, fecha de acceso: agosto 6, 2025, [https://www.jit.io/resources/devsecops/its-not-magic-its-memory-how-to-architect-short-term-memory-for-agentic-ai](https://www.jit.io/resources/devsecops/its-not-magic-its-memory-how-to-architect-short-term-memory-for-agentic-ai)  
16. A Long-Term Memory Agent | 🦜️ LangChain, fecha de acceso: agosto 6, 2025, [https://python.langchain.com/docs/versions/migrating\_memory/long\_term\_memory\_agent/](https://python.langchain.com/docs/versions/migrating_memory/long_term_memory_agent/)  
17. Structured Outputs \- OpenAI API \- OpenAI Platform, fecha de acceso: agosto 6, 2025, [https://platform.openai.com/docs/guides/structured-outputs](https://platform.openai.com/docs/guides/structured-outputs)  
18. Provide or auto-detect a schema | AI Applications \- Google Cloud, fecha de acceso: agosto 6, 2025, [https://cloud.google.com/generative-ai-app-builder/docs/provide-schema](https://cloud.google.com/generative-ai-app-builder/docs/provide-schema)  
19. Optimizing JSON Schema for Scalable Computer Vision Pipelines | Medium, fecha de acceso: agosto 6, 2025, [https://medium.com/@noel.benji/designing-scalable-json-schemas-for-computer-vision-pipelines-dcddf4e7a9f4](https://medium.com/@noel.benji/designing-scalable-json-schemas-for-computer-vision-pipelines-dcddf4e7a9f4)  
20. How AI Is Revolutionizing Electronic Health Records (AI EHR) \- Botscrew, fecha de acceso: agosto 6, 2025, [https://botscrew.com/blog/how-ai-is-revolutionizing-electronic-health-records-ai-ehr/](https://botscrew.com/blog/how-ai-is-revolutionizing-electronic-health-records-ai-ehr/)  
21. EHR vendors turn to artificial intelligence to modernize health ..., fecha de acceso: agosto 6, 2025, [https://www.healthcaredive.com/news/ehr-artificial-intelligence-efforts-epic-oracle/741541/](https://www.healthcaredive.com/news/ehr-artificial-intelligence-efforts-epic-oracle/741541/)  
22. A Complete Guide to AI Agent Architecture in 2025 \- Lindy, fecha de acceso: agosto 6, 2025, [https://www.lindy.ai/blog/ai-agent-architecture](https://www.lindy.ai/blog/ai-agent-architecture)  
23. Long-Term Agentic Memory with LangGraph \- DeepLearning.AI, fecha de acceso: agosto 6, 2025, [https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/](https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/)  
24. LangGraph memory \- Overview, fecha de acceso: agosto 6, 2025, [https://langchain-ai.github.io/langgraph/concepts/memory/](https://langchain-ai.github.io/langgraph/concepts/memory/)  
25. AI Agents Explained: From Theory to Practical Deployment \- n8n Blog, fecha de acceso: agosto 6, 2025, [https://blog.n8n.io/ai-agents/](https://blog.n8n.io/ai-agents/)  
26. A Guide to Incorporating AI Agents In Your Product Stack \- Superteams.ai, fecha de acceso: agosto 6, 2025, [https://www.superteams.ai/blog/a-guide-to-incorporating-ai-agents-in-your-product-stack](https://www.superteams.ai/blog/a-guide-to-incorporating-ai-agents-in-your-product-stack)  
27. C3 Generative AI's Intelligent Query Agents Unlock Structured Data Insights \- C3 AI, fecha de acceso: agosto 6, 2025, [https://c3.ai/blog/c3-generative-ais-intelligent-query-agents-unlock-structured-data-insights/](https://c3.ai/blog/c3-generative-ais-intelligent-query-agents-unlock-structured-data-insights/)  
28. raw.githubusercontent.com, fecha de acceso: agosto 6, 2025, [https://raw.githubusercontent.com/miklevin/MikeLev.in/main/\_posts/2025-01-11-refactoring-ai-assisted-code.md](https://raw.githubusercontent.com/miklevin/MikeLev.in/main/_posts/2025-01-11-refactoring-ai-assisted-code.md)  
29. Building AI-Powered Applications with Azure Database for PostgreSQL, fecha de acceso: agosto 6, 2025, [https://visualstudiomagazine.com/Articles/2025/08/07/Building-AI-Powered-Applications-with-Azure-Database-for-PostgreSQL.aspx](https://visualstudiomagazine.com/Articles/2025/08/07/Building-AI-Powered-Applications-with-Azure-Database-for-PostgreSQL.aspx)  
30. LLM-based care workflow optimization for clinical documentation. | by Harish Vadada, fecha de acceso: agosto 6, 2025, [https://medium.com/@harish.vadada/llm-based-care-workflow-optimization-for-clinical-documentation-1a3894a6ca4e](https://medium.com/@harish.vadada/llm-based-care-workflow-optimization-for-clinical-documentation-1a3894a6ca4e)  
31. Zero-Shot Large Language Models for Long Clinical Text Summarization with Temporal Reasoning \- arXiv, fecha de acceso: agosto 6, 2025, [https://arxiv.org/html/2501.18724v2](https://arxiv.org/html/2501.18724v2)  
32. Clinical entity augmented retrieval for clinical information extraction ..., fecha de acceso: agosto 6, 2025, [https://pmc.ncbi.nlm.nih.gov/articles/PMC11743751/](https://pmc.ncbi.nlm.nih.gov/articles/PMC11743751/)  
33. How AI Agents Are Improving EHR/EMR Systems in Healthcare \- Bitcot, fecha de acceso: agosto 6, 2025, [https://www.bitcot.com/how-ai-agents-are-improving-ehr-emr-systems-in-healthcare/](https://www.bitcot.com/how-ai-agents-are-improving-ehr-emr-systems-in-healthcare/)  
34. Clinical Applications, Technical Challenges, and Ethical Considerations \- KoreaMed Synapse, fecha de acceso: agosto 6, 2025, [https://synapse.koreamed.org/articles/1516090747](https://synapse.koreamed.org/articles/1516090747)  
35. How to Build an AI Agent for Healthcare: A Step-by-Step Guide, fecha de acceso: agosto 6, 2025, [https://www.aalpha.net/blog/how-to-build-ai-agent-for-healthcare/](https://www.aalpha.net/blog/how-to-build-ai-agent-for-healthcare/)