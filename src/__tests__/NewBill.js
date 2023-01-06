/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore, { resetList } from "../__mocks__/store.js";
import router from "../app/Router.js";
import { fireEvent } from "@testing-library/dom";

jest.mock("../app/Store", () => mockStore);

const setupEmployee = () => {
	Object.defineProperty(window, "localStorage", { value: localStorageMock });
	window.localStorage.setItem(
		"user",
		JSON.stringify({
			type: "Employee",
		})
	);
	const root = document.createElement("div");
	root.setAttribute("id", "root");
	document.body.append(root);
	router();
};

const setupFileInput = () => {
	setupEmployee();
	window.onNavigate(ROUTES_PATH.NewBill);
	const file = new File(["(⌐□_□)"], "chucknorris.png", {
		type: "image/png",
	});
	const input = screen.getByTestId("file");
	Object.defineProperty(input, "files", {
		value: [file],
	});
	fireEvent.change(input);
};

const setupForm = () => {
	screen.getByTestId("expense-type").value = "Transports";
	screen.getByTestId("expense-name").value = "Taxi";
	screen.getByTestId("datepicker").value = "2021-01-01";
	screen.getByTestId("amount").value = "100";
	screen.getByTestId("vat").value = "20";
	screen.getByTestId("pct").value = "20";
};

describe("Given I am connected as an employee", () => {
	afterEach(() => {
		console.log("afterEach");
		resetList();
	});
	describe("When I am on NewBill Page", () => {
		describe("When I fill in an input with a not authorized file", () => {
			test("Then the file should not be uploaded", async () => {
				setupEmployee();
				window.onNavigate(ROUTES_PATH.NewBill);
				const file = new File(["(⌐□_□)"], "chucknorris.pdf", {
					type: "application/pdf",
				});
				const input = screen.getByTestId("file");
				Object.defineProperty(input, "files", {
					value: [file],
				});
				fireEvent.change(input);
				const errorMessage = await screen.getByTestId("error-message");
				expect(errorMessage).toBeTruthy();
			});
		});
	});
	describe("When I submit a new bill with a authorized file", () => {
		beforeEach(() => {
			setupFileInput();
		});
		test("Then no error should get displayed", async () => {
			const errorMessage = await screen.queryByTestId("error-message");
			expect(errorMessage).toBeFalsy();
		});
		test("Then i should be redirected to the Bills page", async () => {
			setupForm();
			const submitButton = screen.getByTestId("form-new-bill");
			fireEvent.submit(submitButton);
			const currentUrl = window.location.hash;
			expect(currentUrl).toBe(ROUTES_PATH["Bills"]);
		});
	});
	describe("I'm on the Bill page and I add a new bill", () => {
		test("There should be one more new bill", async () => {
			setupEmployee();
			window.onNavigate(ROUTES_PATH.Bills);
			let tbody = await waitFor(() => screen.getByTestId("tbody"));
			const oldBillNumber = tbody.childElementCount;
			setupFileInput();
			setupForm();
			const submitButton = screen.getByTestId("form-new-bill");
			fireEvent.submit(submitButton);
			tbody = await waitFor(() => screen.getByTestId("tbody"));
			// check taht the table body contains the same number of rows as the bills array
			expect(tbody.childElementCount).toEqual(oldBillNumber + 1);
		});
	});
});
