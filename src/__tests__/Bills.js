/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills as mockBillsData } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import store from "../app/Store.js";
import router from "../app/Router.js";
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

describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page", () => {
		test("Then bill icon in vertical layout should be highlighted", async () => {
			setupEmployee();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			const windowIcon = screen.getByTestId("icon-window");
			//to-do write expect expression
			expect(windowIcon).toBeTruthy();
		});
		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: mockBillsData });
			const dates = screen
				.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
				.map((a) => a.innerHTML);
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});
		test("Then I should get the same number of bills than what's stored", async () => {
			setupEmployee();
			window.onNavigate(ROUTES_PATH.Dashboard);
			await waitFor(() => screen.getByText("Mes notes de frais"));
			const tbody = screen.getByTestId("tbody");
			// check taht the table body contains the same number of rows as the bills array
			expect(tbody.childElementCount).toEqual(mockBillsData.length);
		});
	});
	describe("When I click on the 'new bill' button", () => {
		test("It should move to the newBill url", async () => {
			setupEmployee();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("btn-new-bill"));
			const bills = new Bills({ document, onNavigate, store, localStorage });
			bills.handleClickNewBill();
			expect(screen.getByTestId("form-new-bill")).toBeTruthy();
		});
	});
	describe("When I click on the eye icon", () => {
		test("It should open a modal", async () => {
			setupEmployee();
			$.fn.modal = jest.fn();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getAllByTestId("icon-eye"));
			const bills = new Bills({ document, onNavigate, store, localStorage });
			const icon = screen.getAllByTestId("icon-eye")[0];
			bills.handleClickIconEye(icon);
			expect(screen.getByTestId("modal-image")).toBeTruthy();
		});
	});
	describe("When something is wrong with the fetch", () => {
		test("I should get an error", async () => {
			jest.spyOn(mockStore, "bills");
			setupEmployee();
			mockStore.bills.mockImplementationOnce(() => {
				return {
					list: () => {
						return Promise.reject(new Error("Erreur 404"));
					},
				};
			});
			window.onNavigate(ROUTES_PATH.Bills);
			await new Promise(process.nextTick);
			const message = screen.getByText(/Erreur 404/);
			expect(message).toBeTruthy();
		});
	});
});
