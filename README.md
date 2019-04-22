# Outdated Synthetics Monitors
A Scripted Monitor to check which of your Monitors are running on outdated versions

As new Synthetics versions are released, there is no easy way to check which of your Synthetics Monitors are still running on an old Runtime. Some customers have thousands of monitors per account, and it's a drag to have to go through each one to check the version. The `apiVersion` attribute is currently only available through the Synthetics REST API, so customers are not able to check this in Insights.

With that in mind, I decided to keep this in the family and write a Synthetics Script that does all this for you. It grabs all your monitors, checks which ones are not running on the newest version, and sends them as Custom Events to Insights, including a handy link that will take you straight to the Monitors Edit page.

All you need to run it is:

- Admin API Key
- Insights Insert Key
- Your Account ID


You can either paste them into the script directly, but if you already have them as Secure Credentials then even better. And that's it! Just Validate the script and make sure you see a *200* Response in the Log. Then you should be able to query the data in Insights.

```
SELECT * FROM OutdatedMonitors SINCE 30 MINUTES AGO
```

If you're not seeing data, you can check the `NrIntegrationError` event for any errors
