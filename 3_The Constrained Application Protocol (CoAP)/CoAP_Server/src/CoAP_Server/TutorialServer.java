package CoAP_Server;

import org.eclipse.californium.core.CoapServer;

public class TutorialServer extends CoapServer {
	public static void main (String[] args) {
		TutorialServer tutorialServer = new TutorialServer();
		HelloWorldResource hello = new HelloWorldResource("hello-world");
		tutorialServer.add(hello);
		tutorialServer.start();
	}

}
