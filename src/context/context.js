import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();
//we now have access to the Provider, Consumer component in context api - GithubContext.Provider - GithubContext.Consumer

const GithubProvider = ({ children }) => {
	const [githubUser, setGithubUser] = useState(mockUser);
	const [repos, setRepos] = useState(mockRepos);
	const [followers, setFollowers] = useState(mockFollowers);

	// request - loading
	const [requests, setRequests] = useState(0);
	const [isLoading, setIsLoading] = useState(false);

	// error state
	const [error, setError] = useState({ show: false, msg: "" });

	// search github user function
	const searchGithubUser = async (user) => {
		toggleError();
		setIsLoading(true);
		const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
			console.log(err),
		);
		// toggleError
		if (response) {
			setGithubUser(response.data);
			const { login, followers_url, repos_url } = response.data;

			/* 	//fetching repos
			axios(`${repos_url}?per_page=100`).then((response) =>
				setRepos(response.data),
			);
			//fetching followers
			axios(`${followers_url}?per_page=100`).then((response) =>
				setFollowers(response.data),
			); */

			// used promise.allSettled to get all request(fetching respos and followers data) data at the same time and commented out the above api call --- both responses are same

			await Promise.allSettled([
				axios(`${repos_url}?per_page=100`),
				axios(`${followers_url}?per_page=100`),
			])
				.then((results) => {
					const [repos, followers] = results;
					const status = "fulfilled";
					if (repos.status === status) {
						setRepos(repos.value.data);
					}
					if (followers.status === status) {
						setFollowers(followers.value.data);
					}
				})
				.catch((err) => console.log(err));
		} else {
			toggleError(true, "sorry, user not found");
		}
		checkRequests();
		setIsLoading(false);
	};

	// check rate - checkRequest function
	const checkRequests = () =>
		axios(`${rootUrl}/rate_limit`)
			.then(({ data }) => {
				let {
					rate: { remaining },
				} = data;
				setRequests(remaining);

				// if rate limit is equal 0
				if (remaining === 0) {
					// throw an error
					toggleError(
						true,
						"sorry, you have exceeded your hourly rate limit!.",
					);
				}
			})
			.catch((err) => console.log(err));

	// error - error function
	function toggleError(show = false, msg = "") {
		setError({ show, msg });
	}

	useEffect(checkRequests, []);
	return (
		<GithubContext.Provider
			value={{
				githubUser,
				repos,
				followers,
				requests,
				error,
				searchGithubUser,
				isLoading,
			}}
		>
			{children}
		</GithubContext.Provider>
	);
};

export { GithubProvider, GithubContext };
