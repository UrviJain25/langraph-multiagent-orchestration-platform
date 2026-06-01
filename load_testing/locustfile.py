import random
from locust import HttpUser, SequentialTaskSet, task, between


class WorkflowUserJourney(SequentialTaskSet):
    def on_start(self):
        """Runs when a simulated user starts their journey.
        Initializes variables to track state."""
        self.request_id = None

    @task
    def start_workflow(self):
        """Step 1: Start a new workflow and grab the request_id."""
        payload = {"query": f"Performance test query {random.randint(1000, 9999)}"}

        with self.client.post(
            "/workflow/start", json=payload, catch_response=True
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.request_id = data.get("request_id")
                    if not self.request_id:
                        response.failure("Response missing 'request_id'")
                except ValueError:
                    response.failure("Response was not valid JSON")
            else:
                response.failure(f"Failed to start workflow: {response.status_code}")

    @task
    def check_status(self):
        """Step 2: Check the status of the created workflow."""
        if not self.request_id:
            self.interrupt()  # Skip if previous step failed
            return

        self.client.get(f"/workflow/{self.request_id}", name="/workflow/{request_id}")

    @task
    def handle_approval_or_rejection(self):
        """Step 3: Randomly approve or reject the workflow to test both endpoints."""
        if not self.request_id:
            self.interrupt()
            return

        # 80% chance to approve, 20% to reject
        decision = "approve" if random.random() < 0.8 else "reject"
        endpoint = f"/workflow/{self.request_id}/{decision}"

        self.client.post(endpoint, name=f"/workflow/{{request_id}}/{decision}")

        # Journey complete, stop this sequence so a new one can start
        self.interrupt()


class WorkflowLoadTester(HttpUser):
    # Simulates a user waiting 1 to 3 seconds between actions
    wait_time = between(1, 3)
    tasks = [WorkflowUserJourney]
